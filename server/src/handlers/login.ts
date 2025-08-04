
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput, type User } from '../schema';
import { eq } from 'drizzle-orm';

export const login = async (input: LoginInput): Promise<User> => {
  try {
    // Find user by email
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .execute();

    if (users.length === 0) {
      throw new Error('Invalid email or password');
    }

    const user = users[0];

    // In a real implementation, you would verify the password hash here
    // For now, we'll use a simple comparison as a placeholder
    // TODO: Replace with proper password verification using bcrypt or similar
    if (input.password !== 'password') {
      throw new Error('Invalid email or password');
    }

    return {
      id: user.id,
      email: user.email,
      password_hash: user.password_hash,
      name: user.name,
      created_at: user.created_at,
      updated_at: user.updated_at
    };
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};
