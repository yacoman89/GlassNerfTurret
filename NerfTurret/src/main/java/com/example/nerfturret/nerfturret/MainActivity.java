package com.example.nerfturret.nerfturret;

import android.app.Activity;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.graphics.PixelFormat;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Bundle;
import android.os.IBinder;
import android.util.Log;
import android.view.WindowManager;
import android.widget.MediaController;
import android.widget.VideoView;


public class MainActivity extends Activity {

    private static final String TAG = "MainActivity";
    AttitudeService mService;
    boolean mBound = false;

    private String videoPath = "rtsp://192.168.1.30:5554/test.sdp";

    VideoView videoView;


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        Log.i(TAG, "onCreate");
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

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
            MediaController mediaController = new MediaController(MainActivity.this);
            mediaController.setAnchorView(videoView);

            Uri video = Uri.parse(videoPath);
            videoView.setMediaController(mediaController);
            videoView.setVideoURI(video);
            videoView.requestFocus();
            videoView.setOnPreparedListener(new MediaPlayer.OnPreparedListener() {

                public void onPrepared(MediaPlayer mp) {
                    videoView.start();
                }
            });
        } catch (Exception e) {
            Log.i(TAG, "Video Play Error :" + e.toString());
            //finish();
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
