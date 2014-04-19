package com.example.nerfturret.nerfturret;


import android.os.AsyncTask;
import android.util.Log;

import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.IOException;
import java.lang.reflect.Array;
import java.net.Socket;
import java.util.ArrayList;

/**
 * Created by Yaco on 4/19/2014.
 */
public class SpeechToTextSocket extends AsyncTask<ArrayList<String>,Void,Void> {

    Socket socket;
    DataInputStream dataInputStream;
    DataOutputStream dataOutputStream;
    public static final String TAG = "Socket for voice";

    @Override
    protected Void doInBackground(ArrayList<String>... params) {
//        try {
//            socket = new Socket("192.168.1.1", 6789);
//            dataInputStream = new DataInputStream(socket.getInputStream());
//            dataOutputStream = new DataOutputStream(socket.getOutputStream());

            for(int i=0; i<params[0].size(); i++) {
                String text = params[0].get(i);

                Log.i(TAG, text);
                //dataOutputStream.writeBytes(text);
            }

//        } catch (IOException e) {
//            e.printStackTrace();
//        }


        return null;
    }
}
