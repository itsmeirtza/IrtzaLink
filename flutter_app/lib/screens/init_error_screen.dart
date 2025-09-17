import 'package:flutter/material.dart';

class InitErrorScreen extends StatelessWidget {
  final Object error;
  final StackTrace? stack;
  const InitErrorScreen({super.key, required this.error, this.stack});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Icon(Icons.error_outline, size: 72, color: Colors.redAccent),
              const SizedBox(height: 16),
              const Text(
                'App initialization failed',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 8),
              Text(
                '$error',
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.black54),
              ),
              const SizedBox(height: 16),
              const Text(
                'Tip: Make sure Firebase is configured for Android. Place google-services.json in android/app and enable Authentication providers in Firebase Console.',
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}