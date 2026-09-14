package com.masar.studentapp;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.BufferedInputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

@CapacitorPlugin(name = "MasarDownloader")
public class MasarDownloaderPlugin extends Plugin {

    @PluginMethod
    public void download(PluginCall call) {
        String urlString = call.getString("url", "").trim();
        String fileName = call.getString("fileName", "").trim();
        String mimeType = call.getString("mimeType", "application/octet-stream").trim();

        if (urlString.isEmpty() || fileName.isEmpty()) {
            call.reject("بيانات الملف غير مكتملة");
            return;
        }

        if (!hasInternet()) {
            call.reject("لا يوجد اتصال بالإنترنت");
            return;
        }

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            call.reject("هذا الإصدار من أندرويد يحتاج صلاحية التخزين");
            return;
        }

        new Thread(() -> {
            Uri itemUri = null;
            HttpURLConnection connection = null;
            try {
                URL url = new URL(urlString);
                connection = (HttpURLConnection) url.openConnection();
                connection.setConnectTimeout(15000);
                connection.setReadTimeout(30000);
                connection.setInstanceFollowRedirects(true);
                connection.setRequestProperty("Accept", "*/*");
                connection.connect();

                int responseCode = connection.getResponseCode();
                if (responseCode < 200 || responseCode >= 300) {
                    throw new Exception("HTTP " + responseCode);
                }

                ContentResolver resolver = getContext().getContentResolver();
                ContentValues values = new ContentValues();
                values.put(MediaStore.Downloads.DISPLAY_NAME, fileName);
                values.put(MediaStore.Downloads.MIME_TYPE, mimeType);
                values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
                values.put(MediaStore.Downloads.IS_PENDING, 1);

                itemUri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                if (itemUri == null) throw new Exception("تعذر إنشاء ملف التنزيل");

                try (InputStream input = new BufferedInputStream(connection.getInputStream());
                     OutputStream output = resolver.openOutputStream(itemUri)) {
                    if (output == null) throw new Exception("تعذر فتح ملف التنزيل");
                    byte[] buffer = new byte[8192];
                    int count;
                    while ((count = input.read(buffer)) != -1) {
                        output.write(buffer, 0, count);
                    }
                    output.flush();
                }

                ContentValues done = new ContentValues();
                done.put(MediaStore.Downloads.IS_PENDING, 0);
                resolver.update(itemUri, done, null, null);

                JSObject result = new JSObject();
                result.put("success", true);
                result.put("fileName", fileName);
                result.put("location", "Download");
                notifyResolve(call, result);
            } catch (Exception e) {
                if (itemUri != null) {
                    try { getContext().getContentResolver().delete(itemUri, null, null); } catch (Exception ignored) {}
                }
                notifyReject(call, e.getMessage() == null ? "فشل تحميل الملف" : e.getMessage());
            } finally {
                if (connection != null) connection.disconnect();
            }
        }).start();
    }

    private boolean hasInternet() {
        ConnectivityManager cm = (ConnectivityManager) getContext().getSystemService(Context.CONNECTIVITY_SERVICE);
        if (cm == null) return false;
        Network network = cm.getActiveNetwork();
        if (network == null) return false;
        NetworkCapabilities capabilities = cm.getNetworkCapabilities(network);
        return capabilities != null && capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET);
    }

    private void notifyResolve(PluginCall call, JSObject result) {
        getActivity().runOnUiThread(() -> call.resolve(result));
    }

    private void notifyReject(PluginCall call, String message) {
        getActivity().runOnUiThread(() -> call.reject(message));
    }
}
