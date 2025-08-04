
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type RegisterInput } from '../schema';
import { register } from '../handlers/register';
import { eq } from 'drizzle-orm';

const testInput: RegisterInput = {
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User'
};

describe('register', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should register a new user', async () => {
    const result = await register(testInput);

    // Basic field validation
    expect(result.email).toEqual('test@example.com');
    expect(result.name).toEqual('Test User');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.password_hash).toBeDefined();
    expect(result.password_hash).not.toEqual('password123'); // Should be hashed
  });

  it('should save user to database', async () => {
    const result = await register(testInput);

    // Query database to verify user was saved
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].name).toEqual('Test User');
    expect(users[0].password_hash).toBeDefined();
    expect(users[0].created_at).toBeInstanceOf(Date);
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should hash the password', async () => {
    const result = await register(testInput);

    // Verify password was hashed using Bun's password verification
    const isValid = await Bun.password.verify('password123', result.password_hash);
    expect(isValid).toBe(true);

    // Verify wrong password fails
    const isInvalid = await Bun.password.verify('wrongpassword', result.password_hash);
    expect(isInvalid).toBe(false);
  });

  it('should reject duplicate email', async () => {
    // Register first user
    await register(testInput);

    // Attempt to register second user with same email
    await expect(register(testInput)).rejects.toThrow(/email already exists/i);
  });

  it('should allow different emails', async () => {
    // Register first user
    const firstUser = await register(testInput);

    // Register second user with different email
    const secondInput: RegisterInput = {
      email: 'different@example.com',
      password: 'password456',
      name: 'Different User'
    };

    const secondUser = await register(secondInput);

    expect(firstUser.id).not.toEqual(secondUser.id);
    expect(firstUser.email).toEqual('test@example.com');
    expect(secondUser.email).toEqual('different@example.com');
  });
});
