package com.example.nerfturret.nerfturret;

import android.app.Activity;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.graphics.PixelFormat;
import android.net.Uri;
import android.os.Bundle;
import android.os.IBinder;
import android.util.Log;
import android.view.WindowManager;
import android.widget.VideoView;


public class MainActivity extends Activity {

    private static final String TAG = "MainActivity";
    AttitudeService mService;
    boolean mBound = false;


    //private String videoPath = "rtsp://184.72.239.149/vod/mp4:BigBuckBunny_115k.mov";
    private String videoPath = "rtsp://192.168.1.10:8888/test.mov";
    //private String videoPath = "rtp://192.168.1.49:5004";

    VideoView videoView;


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        Log.i(TAG, "onCreate");
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        videoView = (VideoView) findViewById(R.id.videoView);

        PlayVideo();

        Intent intent = new Intent(this, AttitudeService.class);
        startService(intent);
        Log.i(TAG, "StartService");
        bindService(intent, mConnection, Context.BIND_AUTO_CREATE);
    }

    private void PlayVideo() {
        try {
            getWindow().setFormat(PixelFormat.OPAQUE);
            //MediaController mediaController = new MediaController(MainActivity.this);
            // mediaController.setAnchorView(videoView);

            Uri video = Uri.parse(videoPath);
            //videoView.setMediaController(mediaController);
            videoView.setVideoURI(video);
            videoView.requestFocus();
            //videoView.setOnPreparedListener(new MediaPlayer.OnPreparedListener() {

            //public void onPrepared(MediaPlayer mp) {
            //videoView.start();
            //}
            // });
            videoLoop videoLoop = new videoLoop();

            videoLoop.start();
            Log.i(TAG, "Call Thread");



        } catch (Exception e) {
            Log.i(TAG, "Video Play Error :" + e.toString());
            finish();
        }
    }


    public class videoLoop extends Thread {

        int videoRunning = 0;

        public void run() {
            Log.i(TAG, "Thread running");
            while(true) {
                switch (videoRunning){
                    case 0:
                        videoView.start();
                        Log.i(TAG, "video started");
                        videoRunning = 1;
                        /*try {
                            wait(10000);
                        } catch (InterruptedException e) {
                            e.printStackTrace();
                        }
                        break;
                    case 1:
                        if(!videoView.isPlaying()) {
                            Log.i(TAG, "video stopped");
                            videoView.stopPlayback();
                            try {
                                wait(1000);
                            } catch (InterruptedException e) {
                                e.printStackTrace();
                            }
                            videoRunning = 0;
                        }*/
                        break;
                }
            }
        }
    }


    @Override
    protected void onStart()
    {
        Log.i(TAG, "onStart");
        super.onStart();
    }

    @Override
    protected void onResume() {
        Log.i(TAG, "onResume");
        super.onResume();
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }

    @Override
    protected void onStop()
    {
        Log.i(TAG, "onStop");
        super.onStop();
    }

    @Override
    protected void onPause() {
        Log.i(TAG, "onPause");
        super.onPause();
        if (mBound)
        {
            unbindService(mConnection);
            mBound = false;
            Intent intent = new Intent(this, AttitudeService.class);
            stopService(intent);
        }
    }

    private ServiceConnection mConnection = new ServiceConnection() {

        @Override
        public void onServiceConnected(ComponentName className, IBinder service) {
            AttitudeService.AttitudeBinder binder = (AttitudeService.AttitudeBinder) service;
            mService = binder.getService();
            mBound = true;
        }

        @Override
        public void onServiceDisconnected(ComponentName arg0) {
            mBound = false;
        }
    };
}
