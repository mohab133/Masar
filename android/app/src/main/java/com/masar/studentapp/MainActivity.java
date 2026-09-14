package com.masar.studentapp;

import android.graphics.Color;
import android.os.Bundle;
import android.view.Window;

import androidx.core.splashscreen.SplashScreen;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Custom Capacitor plugins must be registered BEFORE BridgeActivity creates the bridge.
        // Otherwise the JS side can report: "plugin is not implemented on android".
        registerPlugin(MasarDownloaderPlugin.class);
        SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);
        configureSystemBars();
    }

    @Override
    public void onResume() {
        super.onResume();
        configureSystemBars();
    }

    private void configureSystemBars() {
        Window window = getWindow();

        // Edge-to-edge without immersive fullscreen. The system bars stay visible.
        WindowCompat.setDecorFitsSystemWindows(window, false);
        window.setStatusBarColor(Color.TRANSPARENT);
        window.setNavigationBarColor(Color.TRANSPARENT);

        WindowInsetsControllerCompat controller =
                WindowCompat.getInsetsController(window, window.getDecorView());

        controller.show(WindowInsetsCompat.Type.statusBars());
        controller.show(WindowInsetsCompat.Type.navigationBars());
        controller.setAppearanceLightStatusBars(true);
        controller.setAppearanceLightNavigationBars(true);
    }
}
