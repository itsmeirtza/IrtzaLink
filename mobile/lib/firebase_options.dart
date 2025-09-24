import 'package:firebase_core/firebase_core.dart';

// This file is a placeholder. Generate a real one with:
// dart pub global activate flutterfire_cli
// flutterfire configure
// Then replace this stub with the generated content.
FirebaseOptions? _generatedOptions;

class DefaultFirebaseOptionsMissing implements Exception {
  @override
  String toString() => 'DefaultFirebaseOptions are missing. Run flutterfire configure.';
}

FirebaseOptions? maybeDefaultOptions() {
  return _generatedOptions; // null until replaced by FlutterFire
}
