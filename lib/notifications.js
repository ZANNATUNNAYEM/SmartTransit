import { connectDB } from '@/lib/db';

import {
  User,
  Notification,
} from '@/models';


export async function sendSmartNotification({
  userId,
  type,
  title,
  message,
}) {

  try {

    await connectDB();


    if (
      !userId ||
      !type ||
      !message
    ) {
      throw new Error(
        'userId, type and message are required'
      );
    }


    const recipient =
      await User.findById(userId);


    if (!recipient) {
      throw new Error(
        'Recipient user not found'
      );
    }


    const subscriptionIds =
      recipient.oneSignalSubscriptionIds || [];


    /*
     * Always save the notification in
     * SmartTransit's database.
     */
    const notification =
      await Notification.create({
        userId: recipient._id,
        type,
        message,
      });


    /*
     * If the user has no OneSignal subscription,
     * the in-app notification still exists.
     */
    if (subscriptionIds.length === 0) {

      return {
        success: true,
        pushSent: false,
        reason:
          'Recipient has no OneSignal subscription',
        notification,
      };

    }


    const appId =
      process.env.ONESIGNAL_APP_ID;

    const apiKey =
      process.env.ONESIGNAL_REST_API_KEY;


    if (!appId || !apiKey) {

      throw new Error(
        'OneSignal environment variables are missing'
      );

    }


    const oneSignalResponse =
      await fetch(
        'https://api.onesignal.com/notifications',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',

            Authorization:
              `Key ${apiKey}`,
          },

          body: JSON.stringify({

            app_id: appId,

            include_subscription_ids:
              subscriptionIds,

            headings: {
              en:
                title || 'SmartTransit',
            },

            contents: {
              en: message,
            },

            url:
              process.env.NEXT_PUBLIC_APP_URL ||
              'http://localhost:3000/passenger/dashboard',

          }),
        }
      );


    const oneSignalData =
      await oneSignalResponse.json();


    if (!oneSignalResponse.ok) {

      console.error(
        'OneSignal push error:',
        oneSignalData
      );


      return {
        success: false,
        pushSent: false,
        notification,
        oneSignalError:
          oneSignalData,
      };

    }


    return {
      success: true,
      pushSent: true,
      notification,
      oneSignal:
        oneSignalData,
    };


  } catch (error) {

    console.error(
      'Smart notification error:',
      error
    );


    throw error;

  }

}