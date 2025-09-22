import 'dart:math' as math;
import 'package:flutter/material.dart';

class Pro3DHero extends StatefulWidget {
  final Widget child;
  const Pro3DHero({super.key, required this.child});

  @override
  State<Pro3DHero> createState() => _Pro3DHeroState();
}

class _Pro3DHeroState extends State<Pro3DHero> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _tilt;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(seconds: 6))..repeat();
    _tilt = Tween(begin: -0.06, end: 0.06).animate(CurvedAnimation(parent: _controller, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, _) {
        final t = _controller.value * 2 * math.pi;
        final rx = math.sin(t) * 0.18; // tilt X
        final ry = math.cos(t) * 0.18; // tilt Y
        final dz = (math.sin(t) + 1) * 30; // subtle depth

        return Transform(
          alignment: Alignment.center,
          transform: Matrix4.identity()
            ..setEntry(3, 2, 0.0015) // perspective
            ..translate(0.0, 0.0, -dz)
            ..rotateX(rx)
            ..rotateY(ry),
          child: DecoratedBox(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(24),
              boxShadow: const [
                BoxShadow(color: Colors.black54, blurRadius: 40, spreadRadius: -10, offset: Offset(0, 20)),
              ],
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [Color(0xFF0F0F10), Color(0xFF111216)],
              ),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(24),
              child: widget.child,
            ),
          ),
        );
      },
    );
  }
}
