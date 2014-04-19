package com.example.nerfturret.nerfturret;

import android.app.Activity;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.graphics.PixelFormat;
import android.net.Uri;
import android.nfc.Tag;
import android.os.AsyncTask;
import android.os.Bundle;
import android.os.IBinder;
import android.speech.RecognizerIntent;
import android.util.Log;
import android.view.KeyEvent;
import android.view.WindowManager;
import android.widget.VideoView;

import java.io.IOException;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.SocketTimeoutException;
import java.util.ArrayList;
import java.util.Collections;


public class MainActivity extends Activity {

    private static final boolean ENABLE_VIDEO = true;
    private static final boolean CLOSE_ON_FAILURE = false;

    private interface DiscoverHostCallback {
        public void discoverHostSuccess(String host);
        public void discoverHostFailure();
    }

    private class DiscoverVoiceChangerCallbacks implements DiscoverHostCallback {

        @Override
        public void discoverHostSuccess(String host) {
            voiceChangerPresent = true;
            voiceChangerPath = host;
            Log.d(TAG, "Voice Changer found at: " + host);
        }

        @Override
        public void discoverHostFailure() {
            voiceChangerPresent = false;
        }
    }

    private class DiscoverPiCallbacks implements DiscoverHostCallback {

        @Override
        public void discoverHostSuccess(String host) {
            MainActivity.this.host = host;

            if(ENABLE_VIDEO) PlayVideo();

            Intent intent = new Intent(MainActivity.this, AttitudeService.class);
            intent.putExtra("ip", host);
            startService(intent);
            Log.i(TAG, "StartService");
            bindService(intent, mConnection, Context.BIND_AUTO_CREATE);
        }

        @Override
        public void discoverHostFailure() {
            if(CLOSE_ON_FAILURE) finish();
        }
    }

    private static final String TAG = "MainActivity";
    private static final int AUTO_DETECT_PORT = 9999;
    private static final int AUTO_DETECT_VOICE_PORT = 9998;
    private static final int AUTO_DETECT_TIMEOUT = 5000;
    AttitudeService mService;
    boolean mBound = false;
    protected static final int RESULT_SPEECH = 1;

    //private String videoPath = "rtsp://184.72.239.149/vod/mp4:BigBuckBunny_115k.mov";
    private String videoPath = ":8888/test.mov";
    private String host = null;
    //private String videoPath = "rtp://192.168.1.49:5004";

    private boolean voiceChangerPresent = false;
    private String voiceChangerPath = "";

    VideoView videoView;

    private class DiscoverHostAsyncTask extends AsyncTask<Integer, Void, String> {
        private DiscoverHostCallback callbacks;

        public DiscoverHostAsyncTask(DiscoverHostCallback callback) {
            this.callbacks = callback;
        }

        @Override
        protected String doInBackground(Integer... params) {
            Log.i("MainActivity", "discovering");
            return discoverHost(params[0], params[1]);
        }

        @Override
        protected void onPostExecute(String s) {
            if(s != null) {
                this.callbacks.discoverHostSuccess(s);
            } else {
                this.callbacks.discoverHostFailure();
            }
        }
    }


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        Log.i(TAG, "onCreate");
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        videoView = (VideoView) findViewById(R.id.videoView);

        new DiscoverHostAsyncTask(new DiscoverPiCallbacks()).execute(AUTO_DETECT_PORT, AUTO_DETECT_TIMEOUT);
        new DiscoverHostAsyncTask(new DiscoverVoiceChangerCallbacks()).execute(AUTO_DETECT_VOICE_PORT, AUTO_DETECT_TIMEOUT);
    }

    private void broadcast (int udpPort, DatagramSocket socket) throws IOException {
        byte[] data = {1};
        for (NetworkInterface iface : Collections.list(NetworkInterface.getNetworkInterfaces())) {
            for (InetAddress address : Collections.list(iface.getInetAddresses())) {
                // Java 1.5 doesn't support getting the subnet mask, so try the two most common.
                byte[] ip = address.getAddress();
                ip[3] = -1; // 255.255.255.0
                try {
                    socket.send(new DatagramPacket(data, data.length, InetAddress.getByAddress(ip), udpPort));
                } catch (Exception ignored) {
                }
                ip[2] = -1; // 255.255.0.0
                try {
                    socket.send(new DatagramPacket(data, data.length, InetAddress.getByAddress(ip), udpPort));
                } catch (Exception ignored) {
                }
            }
        }
        Log.d("MainActivity", "Broadcasted host discovery on port: " + udpPort);
    }


    private String discoverHost(int udpPort, int timeout) {
        DatagramSocket socket = null;
        try {
            socket = new DatagramSocket();
            broadcast(udpPort, socket);
            socket.setSoTimeout(timeout);
            DatagramPacket packet = new DatagramPacket(new byte[0], 0);
            try {
                socket.receive(packet);
            } catch (SocketTimeoutException ex) {
                Log.i("MainActivity", "Host discovery timed out.");
                return null;
            }
            Log.i("MainActivity", "Discovered server: " + packet.getAddress().getHostAddress());
            return packet.getAddress().getHostAddress();

        } catch(IOException ex) {
            Log.e("MainActivity", "Host discovery failed", ex);
            return null;
        } finally {
            if(socket != null) {
                socket.close();
            }
        }
    }

    private void PlayVideo() {
        try {
            getWindow().setFormat(PixelFormat.OPAQUE);
            //MediaController mediaController = new MediaController(MainActivity.this);
            // mediaController.setAnchorView(videoView);

            String videoURI = "rtsp://" + host + videoPath;
            Log.i("MainActivity", "Connecting to video at: " + videoURI);
            Uri video = Uri.parse(videoURI);
            //videoView.setMediaController(mediaController);
            videoView.setVideoURI(video);
            videoView.requestFocus();
            //videoView.setOnPreparedListener(new MediaPlayer.OnPreparedListener() {

            //public void onPrepared(MediaPlayer mp) {
            //videoView.start();
            //}
            // });
            videoView.start();
            Log.i(TAG, "Call Thread");



        } catch (Exception e) {
            Log.i(TAG, "Video Play Error :" + e.toString());
            finish();
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

    @Override
    public boolean onKeyDown(int keycode, KeyEvent event) {
        if (keycode == KeyEvent.KEYCODE_DPAD_CENTER) {

            Intent intent = new Intent(
                    RecognizerIntent.ACTION_RECOGNIZE_SPEECH);

            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, "en-US");

            startActivityForResult(intent, RESULT_SPEECH);

            // user tapped touchpad, do something
            return true;
        }
        super.onKeyDown(keycode, event);
        return false;
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        switch (requestCode) {
            case RESULT_SPEECH: {
                if (resultCode == RESULT_OK && null != data) {

                    ArrayList<String> text = data
                            .getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);

                    SpeechToTextSocket speechToTextSocket = new SpeechToTextSocket(voiceChangerPresent, voiceChangerPath);

                    String command = null;
                    for(int i=0; i<text.size(); i++)
                        command = text.get(i);

                    if(command.startsWith("close"))
                        finish();

                    speechToTextSocket.execute(text);
                }
                break;
            }
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
