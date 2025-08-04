
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type ChangePasswordInput } from '../schema';
import { changePassword } from '../handlers/change_password';
import { eq } from 'drizzle-orm';

describe('changePassword', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const testUser = {
    email: 'test@example.com',
    password_hash: '',
    name: 'Test User'
  };

  const testInput: ChangePasswordInput = {
    current_password: 'oldpassword123',
    new_password: 'newpassword456'
  };

  it('should change password successfully', async () => {
    // Create user with hashed password
    const hashedPassword = await Bun.password.hash(testInput.current_password);
    const result = await db.insert(usersTable)
      .values({
        ...testUser,
        password_hash: hashedPassword
      })
      .returning()
      .execute();

    const userId = result[0].id;

    // Change password
    const changeResult = await changePassword(userId, testInput);

    expect(changeResult.success).toBe(true);

    // Verify password was changed in database
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    const updatedUser = users[0];
    
    // Verify old password no longer works
    const oldPasswordValid = await Bun.password.verify(testInput.current_password, updatedUser.password_hash);
    expect(oldPasswordValid).toBe(false);

    // Verify new password works
    const newPasswordValid = await Bun.password.verify(testInput.new_password, updatedUser.password_hash);
    expect(newPasswordValid).toBe(true);

    // Verify updated_at was changed
    expect(updatedUser.updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent user', async () => {
    const nonExistentUserId = 999;

    await expect(changePassword(nonExistentUserId, testInput))
      .rejects.toThrow(/user not found/i);
  });

  it('should throw error for incorrect current password', async () => {
    // Create user with hashed password
    const hashedPassword = await Bun.password.hash('differentpassword');
    const result = await db.insert(usersTable)
      .values({
        ...testUser,
        password_hash: hashedPassword
      })
      .returning()
      .execute();

    const userId = result[0].id;

    // Attempt to change password with wrong current password
    await expect(changePassword(userId, testInput))
      .rejects.toThrow(/current password is incorrect/i);
  });

  it('should update updated_at timestamp', async () => {
    // Create user with hashed password
    const hashedPassword = await Bun.password.hash(testInput.current_password);
    const result = await db.insert(usersTable)
      .values({
        ...testUser,
        password_hash: hashedPassword
      })
      .returning()
      .execute();

    const userId = result[0].id;
    const originalUpdatedAt = result[0].updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Change password
    await changePassword(userId, testInput);

    // Verify updated_at was changed
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    const updatedUser = users[0];
    expect(updatedUser.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });
});
