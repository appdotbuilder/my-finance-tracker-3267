
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type ChangePasswordInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function changePassword(userId: number, input: ChangePasswordInput): Promise<{ success: boolean }> {
  try {
    // First, get the user to verify current password
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    if (users.length === 0) {
      throw new Error('User not found');
    }

    const user = users[0];

    // Verify current password
    const currentPasswordHash = await Bun.password.hash(input.current_password);
    const isCurrentPasswordValid = await Bun.password.verify(input.current_password, user.password_hash);

    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await Bun.password.hash(input.new_password);

    // Update user with new password hash and updated timestamp
    await db.update(usersTable)
      .set({
        password_hash: newPasswordHash,
        updated_at: new Date()
      })
      .where(eq(usersTable.id, userId))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Password change failed:', error);
    throw error;
  }
}
