
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput } from '../schema';
import { login } from '../handlers/login';

// We'll create the test user data with proper password hash in each test
const testUserEmail = 'test@example.com';
const testUserName = 'Test User';
const testPassword = 'password';

const testLoginInput: LoginInput = {
  email: testUserEmail,
  password: testPassword
};

describe('login', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should authenticate user with valid credentials', async () => {
    // Create test user with properly hashed password
    const passwordHash = await Bun.password.hash(testPassword);
    const testUserData = {
      email: testUserEmail,
      password_hash: passwordHash,
      name: testUserName
    };
    
    await db.insert(usersTable)
      .values(testUserData)
      .execute();

    const result = await login(testLoginInput);

    expect(result.email).toEqual(testUserEmail);
    expect(result.name).toEqual(testUserName);
    expect(result.password_hash).toEqual(passwordHash);
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
    // Create test user with properly hashed password
    const passwordHash = await Bun.password.hash(testPassword);
    const testUserData = {
      email: testUserEmail,
      password_hash: passwordHash,
      name: testUserName
    };
    
    await db.insert(usersTable)
      .values(testUserData)
      .execute();

    const invalidInput: LoginInput = {
      email: testUserEmail,
      password: 'wrongpassword'
    };

    expect(() => login(invalidInput)).toThrow(/invalid email or password/i);
  });

  it('should return user data from database', async () => {
    // Create test user with properly hashed password
    const passwordHash = await Bun.password.hash(testPassword);
    const testUserData = {
      email: testUserEmail,
      password_hash: passwordHash,
      name: testUserName
    };
    
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
