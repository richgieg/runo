import { Client, QueryResult } from 'pg';

export interface IDatabaseRow {
    [columnName: string]: any;
}

class DatabaseService {

    private readonly client: Client;
    private connected: boolean = false;

    constructor() {
        this.client = new Client({
            user: process.env.DATABASE_USERNAME,
            password: process.env.DATABASE_PASSWORD,
            database: process.env.DATABASE_NAME,
            host: process.env.DATABASE_HOST,
            port: Number(process.env.DATABASE_PORT),
        });
        this.connected = false;
    }

    public async query(query: string, args?: any[]): Promise<IDatabaseRow[]> {
        let result: QueryResult;
        await this.connectIfNecessary();
        try {
            result = await this.client.query(query, args);
        } catch(postgresError) {
            console.error(postgresError);
            throw new DatabaseServiceError('Database query failed', postgresError);
        }
        return result.rows;
    }

    public async bulkInsert(tableName: string, columnNames: string[], rows: any[][]): Promise<IDatabaseRow[]> {
        const rowsPerInsert = 1000;
        const query = `insert into ${tableName} (${columnNames.join()}) values`;
        let allReturnedRows: any[] = [];
        for (let i = 0; i < rows.length; i += rowsPerInsert) {
            const rowSlice = rows.slice(i, i + rowsPerInsert);
            const placeholders: string[] = [];
            const values: any[] = [];
            let counter = 1;
            for (const row of rowSlice) {
                placeholders.push(`(${row.map(() => `$${counter++}`).join()})`);
                for (const value of row) {
                    values.push(value);
                }
            }
            const fullQuery = `${query} ${placeholders.join()} returning *`;
            const returnedRows = await this.query(fullQuery, values);
            allReturnedRows = allReturnedRows.concat(returnedRows);
        }
        return allReturnedRows;
    }

    private async connectIfNecessary() {
        if (!this.connected) {
            try {
                await this.client.connect();
            } catch(postgresError) {
                throw new DatabaseServiceError('Could not connect to database', postgresError);
            }
            this.connected = true;
        }
    }

}

export const databaseService = new DatabaseService();

enum ErrorType {
    NotNullViolation,
    UniqueViolation,
    Other,
}

export class DatabaseServiceError extends Error {

    public readonly type: ErrorType;
    public readonly table: string | undefined;
    public readonly column: string | undefined;
    public readonly constraint: string | undefined;

    constructor(message: string, postgresError: any) {
        super(message);
        switch (postgresError.code) {
            case '23502':
                this.type = ErrorType.NotNullViolation;
                break;
            case '23505':
                this.type = ErrorType.UniqueViolation;
                break;
            default:
                this.type = ErrorType.Other;
                break;
        }
        this.table = postgresError.table;
        this.column = postgresError.column;
        this.constraint = postgresError.constraint;
    }

    public isNotNullViolationOnColumn(table: string, column: string): boolean {
        if (this.type === ErrorType.NotNullViolation
                && this.table === table && this.column === column) {
            return true;
        } else {
            return false;
        }
    }

    public isUniqueViolationOnConstraint(constraint: string): boolean {
        if (this.type === ErrorType.UniqueViolation && this.constraint === constraint) {
            return true;
        } else {
            return false;
        }
    }

}
