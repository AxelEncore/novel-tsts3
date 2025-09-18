import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, requireAdmin } from '@/lib/auth';
import { DatabaseAdapter } from '@/lib/database-adapter';

const databaseAdapter = DatabaseAdapter.getInstance();

// Обновление пользователя (роль, статус)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    // Проверка прав администратора
    const adminCheck = await requireAdmin(request);
    if (!adminCheck.success) {
      return NextResponse.json(
        { error: adminCheck.error || 'Недостаточно прав' },
        { status: 403 }
      );
    }

    const userId = (await params).id;
    const { role, status } = await request.json();

    // Проверка существования пользователя
    const existingUser = await databaseAdapter.getUserById(userId);
    if (!existingUser) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Подготовка данных для обновления
    const updates: { role$1: 'admin' | 'manager' | 'user'; isApproved$1: boolean } = {};
    if (role !== undefined) {
      updates.role = role as 'admin' | 'manager' | 'user';
    }
    if (status !== undefined) {
      if (status === 'approved') {
        updates.isApproved = true;
      } else {
        updates.isApproved = status === 'active';
      }
    }

    // Обновление пользователя
    const updatedUser = await databaseAdapter.updateUser(userId, updates);
    
    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Ошибка обновления пользователя' },
        { status: 500 }
      );
    }

    // Преобразование в формат API
    const userResult = {
      id: Number(updatedUser.id),
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      status: updatedUser.isApproved $1 'active' : 'inactive',
      avatar: updatedUser.avatar || null,
      createdAt: updatedUser.created_at,
      updatedAt: updatedUser.updated_at,
      lastLoginAt: updatedUser.lastLoginAt
    };

    return NextResponse.json({ user: userResult });

  } catch (error) {
    console.error('Ошибка обновления пользователя:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// Удаление пользователя
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    // Проверка прав администратора
    const adminCheck = await requireAdmin(request);
    if (!adminCheck.success) {
      return NextResponse.json(
        { error: adminCheck.error || 'Недостаточно прав' },
        { status: 403 }
      );
    }

    const userId = (await params).id;
    const currentUserId = authResult.user!.userId;

    // Нельзя удалить самого себя
    if (userId === currentUserId) {
      return NextResponse.json(
        { error: 'Нельзя удалить самого себя' },
        { status: 400 }
      );
    }

    // Проверка существования пользователя
    const existingUser = await databaseAdapter.getUserById(userId);
    if (!existingUser) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Удаление пользователя
    const success = await databaseAdapter.deleteUser(userId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Ошибка удаления пользователя' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Пользователь успешно удален' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Ошибка удаления пользователя:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}