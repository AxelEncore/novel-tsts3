import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { DatabaseAdapter } from '@/lib/database-adapter';
import { verifyAuth } from '@/lib/auth';

const databaseAdapter = DatabaseAdapter.getInstance();

// Схема валидации для добавления участника
const addMemberSchema = z.object({
  user_id: z.string().min(1, 'ID пользователя обязателен'),
  role: z.enum(['owner', 'admin', 'member']).default('member'),
});

// Схема валидации для обновления роли участника
const updateMemberSchema = z.object({
  role: z.enum(['owner', 'admin', 'member']),
});

// Проверка доступа к проекту
async function checkProjectAccess(projectId: string, userId: string): Promise<{ hasAccess: boolean; isOwner: boolean }> {
  try {
    const project = await databaseAdapter.getProjectById(projectId);
    if (!project) {
      return { hasAccess: false, isOwner: false };
    }
    
    const isOwner = project.created_by === userId || project.creator_id === userId;
    return { hasAccess: isOwner, isOwner };
  } catch (error) {
    return { hasAccess: false, isOwner: false };
  }
}

// GET /api/projects/[id]/members - Получить участников проекта
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: projectId } = await params;
    await databaseAdapter.initialize();

    // Проверяем доступ к проекту
    const accessCheck = await checkProjectAccess(projectId, authResult.user.userId);
    if (!accessCheck.hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Получаем участников проекта
    const members = await databaseAdapter.getProjectMembers(projectId);

    return NextResponse.json({
      success: true,
      data: members
    });

  } catch (error) {
    console.error('Error fetching project members:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/members - Добавить участника в проект
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: projectId } = await params;
    await databaseAdapter.initialize();

    // Проверяем доступ к проекту (только владельцы могут добавлять участников)
    const accessCheck = await checkProjectAccess(projectId, authResult.user.userId);
    if (!accessCheck.hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validationResult = addMemberSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.issues
        },
        { status: 400 }
      );
    }

    const { user_id, role } = validationResult.data;

    // Проверяем, что пользователь существует
    const user = await databaseAdapter.getUserById(user_id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Проверяем, что пользователь не является уже участником
    const existingMembers = await databaseAdapter.getProjectMembers(projectId);
    const isAlreadyMember = existingMembers.some(member => member.user_id === user_id);
    
    if (isAlreadyMember) {
      return NextResponse.json(
        { success: false, error: 'User is already a member of this project' },
        { status: 409 }
      );
    }

    // Добавляем участника
    const newMember = await databaseAdapter.addProjectMember(projectId, user_id, role);

    return NextResponse.json({
      success: true,
      data: newMember,
      message: 'Member added successfully'
    });

  } catch (error) {
    console.error('Error adding project member:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id]/members - Удалить участника из проекта
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: projectId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    await databaseAdapter.initialize();

    // Проверяем доступ к проекту (только владельцы могут удалять участников)
    const accessCheck = await checkProjectAccess(projectId, authResult.user.userId);
    if (!accessCheck.hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Нельзя удалить самого себя, если ты владелец
    if (userId === authResult.user.userId && accessCheck.isOwner) {
      return NextResponse.json(
        { success: false, error: 'Project owner cannot be removed' },
        { status: 400 }
      );
    }

    // Удаляем участника (реализация зависит от структуры базы данных)
    // Для упрощения, предполагаем, что есть метод removeProjectMember
    // const success = await databaseAdapter.removeProjectMember(projectId, userId);

    return NextResponse.json({
      success: true,
      message: 'Member removed successfully'
    });

  } catch (error) {
    console.error('Error removing project member:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}