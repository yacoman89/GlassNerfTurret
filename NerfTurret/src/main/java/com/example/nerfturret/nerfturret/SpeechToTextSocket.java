package com.example.nerfturret.nerfturret;

import android.os.AsyncTask;
import android.util.Log;

import org.apache.commons.io.IOUtils;

import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.IOException;
import java.lang.reflect.Array;
import java.net.Socket;
import java.util.ArrayList;

public class SpeechToTextSocket extends AsyncTask<ArrayList<String>,Void,Void> {

    Socket socket;
    DataInputStream dataInputStream;
    DataOutputStream dataOutputStream;
    public static final String TAG = "Socket for voice";
    public static final int VOICE_CHANGER_PORT = 3000;

    private String host;
    private boolean serverPresent;

    public SpeechToTextSocket(boolean serverPresent, String serverHost) {
        this.host = serverHost;
        this.serverPresent = serverPresent;
    }

    @Override
    protected Void doInBackground(ArrayList<String>... params) {
        try {
            if(serverPresent) {
                socket = new Socket(host, VOICE_CHANGER_PORT);
                dataInputStream = new DataInputStream(socket.getInputStream());
                dataOutputStream = new DataOutputStream(socket.getOutputStream());
            } else {
                Log.d(TAG, "Voice Changer not present -- just logging data");
            }

            String text;
            for(int i=0; i<params[0].size(); i++) {
                text = params[0].get(i);

                Log.i(TAG, text);
                if(serverPresent) dataOutputStream.writeBytes(text + '\n');
            }

        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            IOUtils.closeQuietly(socket);
        }


        return null;
    }
}
