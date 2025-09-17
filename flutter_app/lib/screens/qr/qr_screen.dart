import 'package:flutter/material.dart';

class QRScreen extends StatelessWidget {
  const QRScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('QR Code')),
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.qr_code, size: 64),
            SizedBox(height: 16),
            Text('QR Code Screen', style: TextStyle(fontSize: 20)),
            SizedBox(height: 8),
            Text('Scan or generate QR codes here'),
          ],
        ),
      ),
    );
  }
}