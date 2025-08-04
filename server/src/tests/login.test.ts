
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput } from '../schema';
import { login } from '../handlers/login';

const testUserData = {
  email: 'test@example.com',
  password_hash: 'hashed_password',
  name: 'Test User'
};

const testLoginInput: LoginInput = {
  email: 'test@example.com',
  password: 'password'
};

describe('login', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should authenticate user with valid credentials', async () => {
    // Create test user first
    await db.insert(usersTable)
      .values(testUserData)
      .execute();

    const result = await login(testLoginInput);

    expect(result.email).toEqual('test@example.com');
    expect(result.name).toEqual('Test User');
    expect(result.password_hash).toEqual('hashed_password');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent email', async () => {
    const invalidInput: LoginInput = {
      email: 'nonexistent@example.com',
      password: 'password'
    };

    expect(() => login(invalidInput)).toThrow(/invalid email or password/i);
  });

  it('should throw error for invalid password', async () => {
    // Create test user first
    await db.insert(usersTable)
      .values(testUserData)
      .execute();

    const invalidInput: LoginInput = {
      email: 'test@example.com',
      password: 'wrongpassword'
    };

    expect(() => login(invalidInput)).toThrow(/invalid email or password/i);
  });

  it('should return user data from database', async () => {
    // Create test user first
    const insertResult = await db.insert(usersTable)
      .values(testUserData)
      .returning()
      .execute();

    const createdUser = insertResult[0];
    const result = await login(testLoginInput);

    expect(result.id).toEqual(createdUser.id);
    expect(result.email).toEqual(createdUser.email);
    expect(result.name).toEqual(createdUser.name);
    expect(result.created_at).toEqual(createdUser.created_at);
    expect(result.updated_at).toEqual(createdUser.updated_at);
  });
});
