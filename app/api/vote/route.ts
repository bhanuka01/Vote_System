import { NextResponse } from 'next/server';
import { submitVoteAction } from '@/app/actions/voting';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, first_preference, second_preference } = body;

    if (!token || !first_preference || !second_preference) {
      return NextResponse.json(
        {
          success: false,
          error_code: 'MISSING_FIELDS',
          message: 'Token and both candidate preferences are required.',
        },
        { status: 400 }
      );
    }

    const result = await submitVoteAction(token, first_preference, second_preference);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('[POST /api/vote] Error processing vote request:', error);
    return NextResponse.json(
      {
        success: false,
        error_code: 'SERVER_ERROR',
        message: 'Something went wrong. Please try again.',
      },
      { status: 500 }
    );
  }
}
