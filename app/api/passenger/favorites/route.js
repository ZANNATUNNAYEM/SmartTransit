import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models';
import { verifyAccessToken } from '@/lib/jwt';

export async function GET(request) {
  try {
    await connectDB();

    const token =
      request.cookies.get('access_token')?.value;

    if (!token) {
      return NextResponse.json(
        {
          error: 'Unauthorized'
        },
        {
          status: 401
        }
      );
    }

    const decoded =
      verifyAccessToken(token);

    const user =
      await User.findById(decoded.userId)
        .populate('favoriteRoutes')
        .populate('favoriteStops');

    if (!user) {
      return NextResponse.json(
        {
          error: 'User not found'
        },
        {
          status: 404
        }
      );
    }

    return NextResponse.json({
      success: true,
      favoriteRoutes: user.favoriteRoutes,
      favoriteStops: user.favoriteStops
    });

  } catch (error) {

    console.error(
      'Get favorites error:',
      error
    );

    return NextResponse.json(
      {
        error: error.message
      },
      {
        status: 500
      }
    );

  }
}
export async function DELETE(request) {

  try {

    await connectDB();


    const token =
      request.cookies.get('access_token')?.value;


    if (!token) {

      return NextResponse.json(
        {
          error:'Unauthorized'
        },
        {
          status:401
        }
      );

    }


    const decoded =
      verifyAccessToken(token);


    const body =
      await request.json();


    const {
      type,
      id
    } = body;



    if(!type || !id){

      return NextResponse.json(
        {
          error:'Type and id required'
        },
        {
          status:400
        }
      );

    }



    let update;



    if(type === 'route'){

      update = {
        $pull:{
          favoriteRoutes:id
        }
      };

    }
    else if(type === 'stop'){

      update = {
        $pull:{
          favoriteStops:id
        }
      };

    }
    else{

      return NextResponse.json(
        {
          error:'Invalid favourite type'
        },
        {
          status:400
        }
      );

    }



    await User.findByIdAndUpdate(
      decoded.userId,
      update
    );



    return NextResponse.json({

      success:true,

      message:'Favourite removed successfully'

    });



  } catch(error){


    console.error(
      'Delete favourite error:',
      error
    );


    return NextResponse.json(
      {
        error:error.message
      },
      {
        status:500
      }
    );

  }

}