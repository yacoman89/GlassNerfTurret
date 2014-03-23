package com.example.nerfturret.nerfturret;

import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Binder;
import android.os.IBinder;
import android.util.Log;

import java.io.DataOutputStream;
import java.io.IOException;
import java.net.Socket;

/**
 * Created by yaco on 3/22/14.
 */
public class AttitudeService extends Service implements SensorEventListener {

    private static final String TAG = "AttitudeService";
    private SensorManager mSensorManager;
    Sensor acc;
    Sensor mag;
    Socket socketP = null;
    Socket socketT = null;
    Socket socketA = null;
    DataOutputStream outP = null;
    DataOutputStream outT = null;
    DataOutputStream outA = null;
    float az=0;
    float pt=0;
    float rl=0;
    int azm=0;
    int pan=0;
    int tilt=0;
    int avg=0;
    static int i=0;
    boolean sendData = false;

    @Override
    public void onCreate() {
        super.onCreate();
        Log.i(TAG, "onCreate");
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.i(TAG, "Service Started");
        mSensorManager = (SensorManager) getSystemService(Context.SENSOR_SERVICE);
        acc = mSensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
        mag = mSensorManager.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD);

        mSensorManager.registerListener(this, acc, SensorManager.SENSOR_STATUS_ACCURACY_HIGH);
        mSensorManager.registerListener(this, mag, SensorManager.SENSOR_STATUS_ACCURACY_HIGH);

        if(i==0)
        {
            sendAttitudeData sendAttitudeData = new sendAttitudeData();
            sendAttitudeData.start();
            i=1;
        }

        return startId;
    }

    public void onDestroy() {
        Log.i(TAG, "Service Killed");
        super.onDestroy();
        mSensorManager.unregisterListener(this);
        try {
            socketP.close();
            socketT.close();
            socketA.close();
        } catch (IOException e) {
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
                /*az = orientation[0]*(float)(180/Math.PI);
                pt = orientation[1]*(float)(180/Math.PI);
                rl = orientation[2]*(float)(180/Math.PI);

                azm += (int)az;
                pan += (int)rl;
                tilt += (int)pt;*/
                avg++;

                if(avg==3) {
                    az /= avg;
                    pt /= avg;
                    rl /= avg;
                    //Log.i(TAG, "tilt: " + (180-tilt) + " pan: " + (azm+90));*/
                    sendData = true;
                    while(sendData);
                    az = 0;
                    pt = 0;
                    rl = 0;
                    avg = 0;
                }
                //Log.i(TAG, "SocketStatus: " + socket.isBound());
                /*if(socket.isClosed())
                {
                    try {
                        socket = new Socket("192.168.1.34", 2000);
                        out = new DataOutputStream(socket.getOutputStream());
                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                }*/
            }
        }
    }

    public class sendAttitudeData extends Thread {
        public void run() {
            try {
                socketP = new Socket("192.168.1.34", 2001);
                socketT = new Socket("192.168.1.34", 2000);
                socketA = new Socket("192.168.1.34", 2002);
                outP = new DataOutputStream(socketP.getOutputStream());
                outT = new DataOutputStream(socketT.getOutputStream());
                outA = new DataOutputStream(socketA.getOutputStream());
            } catch (IOException e) {
                e.printStackTrace();
            }

            while(true) {
                if(sendData) {
                    try {
                        outP.writeFloat(az);
                        outT.writeFloat(pt);
                        outA.writeFloat(rl);
                        //outP.writeInt((azm+90));
                        //outT.writeInt((180-tilt));
                    } catch (IOException e) {
                        e.printStackTrace();
                    } catch (NullPointerException e) {
                        e.printStackTrace();
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                    sendData = false;
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
