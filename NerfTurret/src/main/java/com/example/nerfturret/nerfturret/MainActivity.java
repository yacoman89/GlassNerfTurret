package com.example.nerfturret.nerfturret;

import android.app.Activity;
import android.app.ProgressDialog;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.view.WindowManager;
import android.widget.MediaController;
import android.widget.VideoView;


public class MainActivity extends Activity {

    private static final String TAG = "MainActivity";
    AttitudeService mService;
    boolean mBound = false;

    private String videoPath = "rtsp://192.168.1.34:8080";

    private static ProgressDialog progressDialog;
    String videourl;
    VideoView videoView ;


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        Log.i(TAG, "onCreate");
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        videoView = (VideoView) findViewById(R.id.videoView);

        progressDialog = ProgressDialog.show(MainActivity.this, "", "Buffering video...", true);
        progressDialog.setCancelable(true);

        PlayVideo();
    }

    private void PlayVideo() {
        try {
            getWindow().setFormat(PixelFormat.TRANSLUCENT);
            MediaController mediaController = new MediaController(MainActivity.this);
            mediaController.setAnchorView(videoView);

            Uri video = Uri.parse(videoPath);
            videoView.setMediaController(mediaController);
            videoView.setVideoURI(video);
            videoView.requestFocus();
            videoView.setOnPreparedListener(new MediaPlayer.OnPreparedListener() {

                public void onPrepared(MediaPlayer mp) {
                    progressDialog.dismiss();
                    videoView.start();
                }
            });
        } catch (Exception e) {
            progressDialog.dismiss();
            System.out.println("Video Play Error :" + e.toString());
            finish();
        }
    }


    @Override
    protected void onStart()
    {
        Log.i(TAG, "onStart");
        super.onStart();
        Intent intent = new Intent(this, AttitudeService.class);
        startService(intent);
        Log.i(TAG, "StartService");
        //bindService(intent, mConnection, Context.BIND_AUTO_CREATE);
    }

    @Override
    protected void onStop()
    {
        Log.i(TAG, "onStop");
        super.onStop();
        if (mBound)
        {
            //unbindService(mConnection);
            mBound = false;
        }
    }

    /*private ServiceConnection mConnection = new ServiceConnection() {

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
    };*/

}
