import 'package:flutter/material.dart';
import 'package:animations/animations.dart';

class AnimatedPage extends StatelessWidget {
  const AnimatedPage({super.key, required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return PageTransitionSwitcher(
      transitionBuilder: (child, primary, secondary) => SharedAxisTransition(
        animation: primary,
        secondaryAnimation: secondary,
        transitionType: SharedAxisTransitionType.scaled,
        child: child,
      ),
      child: child,
    );
  }
}
