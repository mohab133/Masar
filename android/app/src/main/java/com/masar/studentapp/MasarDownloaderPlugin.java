package com.masar.studentapp;

import android.app.DownloadManager;
import android.content.Context;
import android.database.Cursor;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.HashSet;
import java.util.Set;

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

        Uri sourceUri = Uri.parse(urlString);
        String scheme = sourceUri.getScheme();
        if (scheme == null || !(scheme.equalsIgnoreCase("https"))) {
            call.reject("رابط الملف غير صالح");
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

        try {
            DownloadManager manager = (DownloadManager) getContext().getSystemService(Context.DOWNLOAD_SERVICE);
            if (manager == null) {
                call.reject("تعذر تشغيل خدمة التنزيل");
                return;
            }

            String safeFileName = makeUniqueFileName(fileName);
            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(urlString));
            request.setTitle(safeFileName);
            request.setDescription("Masar • جاري تنزيل الملف");
            request.setMimeType(mimeType);
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setAllowedOverMetered(true);
            request.setAllowedOverRoaming(true);
            request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, safeFileName);

            long downloadId = manager.enqueue(request);

            JSObject result = new JSObject();
            result.put("success", true);
            result.put("fileName", safeFileName);
            result.put("location", "Download");
            result.put("downloadId", downloadId);
            call.resolve(result);
            monitorDownload(downloadId, safeFileName);
        } catch (Exception e) {
            call.reject(e.getMessage() == null ? "تعذر بدء التنزيل" : e.getMessage());
        }
    }

    private void monitorDownload(long downloadId, String fallbackFileName) {
        new Thread(() -> {
            DownloadManager manager = (DownloadManager) getContext().getSystemService(Context.DOWNLOAD_SERVICE);
            if (manager == null) return;

            Cursor cursor = null;
            final long monitorDeadline = System.currentTimeMillis() + (2L * 60L * 60L * 1000L);
            try {
                while (true) {
                    if (System.currentTimeMillis() >= monitorDeadline) {
                        JSObject result = new JSObject();
                        result.put("success", false);
                        result.put("downloadId", downloadId);
                        result.put("fileName", fallbackFileName);
                        result.put("error", "استغرق التنزيل وقتًا طويلًا جدًا، تحقق من الإشعارات أو حاول مرة أخرى");
                        getActivity().runOnUiThread(() -> notifyListeners("downloadComplete", result));
                        return;
                    }

                    cursor = manager.query(new DownloadManager.Query().setFilterById(downloadId));
                    if (cursor == null || !cursor.moveToFirst()) {
                        return;
                    }

                    int status = cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS));
                    if (status == DownloadManager.STATUS_SUCCESSFUL) {
                        String localUri = cursor.getString(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_LOCAL_URI));
                        String title = cursor.getString(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_TITLE));
                        JSObject result = new JSObject();
                        result.put("success", true);
                        result.put("downloadId", downloadId);
                        result.put("fileName", title == null ? fallbackFileName : title);
                        result.put("location", "Download");
                        result.put("localUri", localUri == null ? "" : localUri);
                        getActivity().runOnUiThread(() -> notifyListeners("downloadComplete", result));
                        return;
                    }

                    if (status == DownloadManager.STATUS_FAILED) {
                        int reason = cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_REASON));
                        JSObject result = new JSObject();
                        result.put("success", false);
                        result.put("downloadId", downloadId);
                        result.put("fileName", fallbackFileName);
                        result.put("error", friendlyDownloadError(reason));
                        getActivity().runOnUiThread(() -> notifyListeners("downloadComplete", result));
                        return;
                    }

                    cursor.close();
                    cursor = null;
                    Thread.sleep(500);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            } catch (Exception ignored) {
                // The Android DownloadManager owns the actual download and its notification.
                // A monitoring failure must not turn a successfully started download into an error.
            } finally {
                if (cursor != null) cursor.close();
            }
        }).start();
    }

    private String makeUniqueFileName(String original) {
        String name = original.replaceAll("[\\\\/:*?\"<>|]", "_").trim();
        if (name.isEmpty()) name = "Masar-file";

        String base = name;
        String extension = "";
        int dot = name.lastIndexOf('.');
        if (dot > 0 && dot < name.length() - 1) {
            base = name.substring(0, dot);
            extension = name.substring(dot);
        }

        Set<String> existing = new HashSet<>();
        try (Cursor cursor = getContext().getContentResolver().query(
                android.provider.MediaStore.Downloads.EXTERNAL_CONTENT_URI,
                new String[]{android.provider.MediaStore.Downloads.DISPLAY_NAME},
                null, null, null)) {
            if (cursor != null) {
                int index = cursor.getColumnIndex(android.provider.MediaStore.Downloads.DISPLAY_NAME);
                while (cursor.moveToNext()) {
                    if (index >= 0) existing.add(cursor.getString(index));
                }
            }
        } catch (Exception ignored) {}

        if (!existing.contains(name)) return name;
        for (int i = 1; i < 1000; i++) {
            String candidate = base + " (" + i + ")" + extension;
            if (!existing.contains(candidate)) return candidate;
        }
        return base + " (" + System.currentTimeMillis() + ")" + extension;
    }

    private String friendlyDownloadError(int reason) {
        switch (reason) {
            case DownloadManager.ERROR_FILE_ALREADY_EXISTS:
                return "الملف موجود بالفعل في مجلد التنزيلات";
            case DownloadManager.ERROR_INSUFFICIENT_SPACE:
                return "مساحة التخزين غير كافية لتنزيل الملف";
            case DownloadManager.ERROR_CANNOT_RESUME:
            case DownloadManager.ERROR_UNKNOWN:
                return "تعذر تنزيل الملف، حاول مرة أخرى";
            case DownloadManager.ERROR_HTTP_DATA_ERROR:
            case DownloadManager.ERROR_UNHANDLED_HTTP_CODE:
                return "تعذر الوصول إلى الملف، حاول مرة أخرى";
            default:
                return "فشل تحميل الملف، حاول مرة أخرى";
        }
    }

    private boolean hasInternet() {
        ConnectivityManager cm = (ConnectivityManager) getContext().getSystemService(Context.CONNECTIVITY_SERVICE);
        if (cm == null) return false;
        Network network = cm.getActiveNetwork();
        if (network == null) return false;
        NetworkCapabilities capabilities = cm.getNetworkCapabilities(network);
        return capabilities != null && capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET);
    }

}
