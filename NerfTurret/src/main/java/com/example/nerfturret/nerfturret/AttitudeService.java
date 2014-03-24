package com.example.nerfturret.nerfturret;

import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Binder;
import android.os.IBinder;
import android.util.Log;

import com.google.android.glass.eye.EyeGesture;
import com.google.android.glass.eye.EyeGestureManager;

import java.io.IOException;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;
import java.util.concurrent.LinkedBlockingQueue;

/**
 * Created by yaco on 3/22/14.
 */
public class AttitudeService extends Service implements SensorEventListener {

    private static final String TAG = "AttitudeService";
    private SensorManager mSensorManager;
    Sensor acc;
    Sensor mag;
    DatagramSocket socket = null;
    float az=0;
    float pt=0;
    float rl=0;
    int avg=0;
    LinkedBlockingQueue<float[]> queue = new LinkedBlockingQueue<float[]>(4);

    private EyeGestureManager mEyeGestureManager;
    private EyeSender mEyeSender;
    private EyeSender.EyeEventListener mEyeEventListener;

    @Override
    public void onCreate() {
        super.onCreate();
        Log.i(TAG, "onCreate");

        mEyeGestureManager = EyeGestureManager.from(this);

        mEyeEventListener = new EyeSender.EyeEventListener() {
            @Override
            public void onWink() {
                Log.i(TAG, "Single Wink");
            }

            @Override
            public void onDoubleBlink() {
                Log.i(TAG, "Double Wink");
                try {
                    queue.put(new float[]{1});
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        };

        mEyeSender = new EyeSender(mEyeEventListener);
        setupReceiver();
    }

    public void setupReceiver() {
        // Eye Events
        mEyeGestureManager.stopDetector(EyeGesture.DOUBLE_BLINK);
        mEyeGestureManager.stopDetector(EyeGesture.WINK);

        mEyeGestureManager.enableDetectorPersistently(EyeGesture.DOUBLE_BLINK,
                true);
        //mEyeGestureManager.enableDetectorPersistently(EyeGesture.WINK, true);

        IntentFilter eyeFilter = new IntentFilter(
                "com.google.glass.action.EYE_GESTURE");
        eyeFilter.setPriority(IntentFilter.SYSTEM_HIGH_PRIORITY);

        this.registerReceiver(mEyeSender, eyeFilter);
    }

    public void removeReceiver() {
        // Eye Events
        mEyeGestureManager.stopDetector(EyeGesture.DOUBLE_BLINK);
        mEyeGestureManager.stopDetector(EyeGesture.WINK);

        try{
            this.unregisterReceiver(mEyeSender);
        } catch (Exception e){
            e.printStackTrace();
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.i(TAG, "Service Started");
        mSensorManager = (SensorManager) getSystemService(Context.SENSOR_SERVICE);
        acc = mSensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
        mag = mSensorManager.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD);

        mSensorManager.registerListener(this, acc, SensorManager.SENSOR_STATUS_ACCURACY_HIGH);
        mSensorManager.registerListener(this, mag, SensorManager.SENSOR_STATUS_ACCURACY_HIGH);

        sendAttitudeData sendAttitudeData = new sendAttitudeData();
        sendAttitudeData.start();

        return startId;
    }

    public void onDestroy() {
        Log.i(TAG, "Service Killed");
        super.onDestroy();
        removeReceiver();
        mSensorManager.unregisterListener(this);
        try {
            socket.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public void onAccuracyChanged(Sensor sensor, int accuracy) { }

    float[] mGravity;
    float[] mGeomagnetic;

    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() == Sensor.TYPE_ACCELEROMETER)
            mGravity = event.values;
        if (event.sensor.getType() == Sensor.TYPE_MAGNETIC_FIELD)
            mGeomagnetic = event.values;
        if (mGravity != null && mGeomagnetic != null) {
            float Rin[] = new float[9];
            float Rout[] = new float[9];
            float I[] = new float[9];
            boolean success = SensorManager.getRotationMatrix(Rin, I, mGravity, mGeomagnetic);
            if (success) {
                float orientation[] = new float[3];
                SensorManager.remapCoordinateSystem(Rin, SensorManager.AXIS_X, SensorManager.AXIS_Y+1, Rout);
                SensorManager.getOrientation(Rout, orientation);
                az += orientation[0];
                pt += orientation[1];
                rl += orientation[2];
                avg++;

                if(avg==3) {
                    az /= avg;
                    pt /= avg;
                    rl /= avg;
                    try {
                        queue.put(new float[]{0, az, pt, rl});
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                    az = 0;
                    pt = 0;
                    rl = 0;
                    avg = 0;
                }
            }
        }
    }

    private void floatToByteArray(float f, byte[] bt) {
        int it;

        it = Float.floatToIntBits(f);

        for(int i=0; i<4; i++)
            bt[i] = (byte)((it >> (8*i)) & 0xFF);
    }

    public class sendAttitudeData extends Thread {

        private byte[] pitch = new byte[4];
        private byte[] tilt = new byte[4];
        private byte[] roll = new byte[4];

        DatagramPacket outP = null;
        DatagramPacket outT = null;
        DatagramPacket outR = null;
        DatagramPacket outS = null;

        public void run() {
            try {
                outP = new DatagramPacket(new byte[0], 0, InetAddress.getByName("192.168.1.30"), 2001);
                outT = new DatagramPacket(new byte[0], 0, InetAddress.getByName("192.168.1.30"), 2000);
                outR = new DatagramPacket(new byte[0], 0, InetAddress.getByName("192.168.1.30"), 2002);
                outS = new DatagramPacket(new byte[] {(byte)1},1, InetAddress.getByName("192.168.1.30"), 2003);

                socket = new DatagramSocket(4000);
            } catch (IOException e) {
                e.printStackTrace();
            }

            while(true) {
                try {
                    //Log.i(TAG, "Send Started");
                    float[] values = queue.take();

                    int flag = (int)values[0];

                    switch (flag) {
                        case 0:
                            //Log.i(TAG, "Value Taken");
                            floatToByteArray(values[1], pitch);
                            floatToByteArray(values[2], tilt);
                            floatToByteArray(values[3], roll);

                            outP.setData(pitch);
                            outT.setData(tilt);
                            outR.setData(roll);

                            socket.send(outP);
                            socket.send(outT);
                            socket.send(outR);
                            //Log.i(TAG, "Sending Finished");
                            break;
                        case 1:
                            socket.send(outS);
                    }

                } catch (IOException e) {
                    e.printStackTrace();
                } catch (NullPointerException e) {
                    e.printStackTrace();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }
    }

    private final IBinder mBinder = new AttitudeBinder();

    public class AttitudeBinder extends Binder{
        AttitudeService getService(){
            return AttitudeService.this;
        }
    }

    @Override
    public IBinder onBind(Intent intent){
        return mBinder;
    }

}
