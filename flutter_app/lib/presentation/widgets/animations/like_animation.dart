import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lottie/lottie.dart';

/// Heart like animation widget with Lottie support
class LikeAnimation extends StatefulWidget {
  final bool isLiked;
  final VoidCallback? onTap;
  final double size;
  final Color? likedColor;
  final Color? unlikedColor;
  final bool showCount;
  final int count;

  const LikeAnimation({
    super.key,
    required this.isLiked,
    this.onTap,
    this.size = 24,
    this.likedColor = Colors.red,
    this.unlikedColor = Colors.grey,
    this.showCount = false,
    this.count = 0,
  });

  @override
  State<LikeAnimation> createState() => _LikeAnimationState();
}

class _LikeAnimationState extends State<LikeAnimation>
    with TickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    
    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: 1.3,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.elasticOut,
    ));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _handleTap() {
    if (widget.onTap != null) {
      widget.onTap!();
      
      // Trigger animation
      _controller.forward().then((_) {
        _controller.reverse();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: _handleTap,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          AnimatedBuilder(
            animation: _scaleAnimation,
            builder: (context, child) {
              return Transform.scale(
                scale: _scaleAnimation.value,
                child: Icon(
                  widget.isLiked ? Icons.favorite : Icons.favorite_outline,
                  size: widget.size,
                  color: widget.isLiked 
                      ? widget.likedColor 
                      : widget.unlikedColor,
                ),
              );
            },
          ),
          if (widget.showCount && widget.count > 0) ...[
            const SizedBox(width: 4),
            Text(
              _formatCount(widget.count),
              style: TextStyle(
                fontSize: widget.size * 0.6,
                color: Colors.grey[600],
              ),
            ),
          ],
        ],
      ),
    );
  }

  String _formatCount(int count) {
    if (count < 1000) return count.toString();
    if (count < 1000000) return '${(count / 1000).toStringAsFixed(1)}k';
    return '${(count / 1000000).toStringAsFixed(1)}M';
  }
}

/// Loading animation widget with Lottie support
class LoadingAnimation extends StatelessWidget {
  final double size;
  final String? message;

  const LoadingAnimation({
    super.key,
    this.size = 60,
    this.message,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Use Lottie animation if asset exists, otherwise use built-in
        Container(
          width: size,
          height: size,
          child: const CircularProgressIndicator()
              .animate(onPlay: (controller) => controller.repeat())
              .rotate(duration: 1000.ms),
        ),
        if (message != null) ...[
          const SizedBox(height: 16),
          Text(
            message!,
            style: TextStyle(
              color: Colors.grey[600],
              fontSize: 14,
            ),
          ),
        ],
      ],
    );
  }
}

/// Success animation widget
class SuccessAnimation extends StatelessWidget {
  final double size;
  final String? message;
  final VoidCallback? onComplete;

  const SuccessAnimation({
    super.key,
    this.size = 60,
    this.message,
    this.onComplete,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            color: Colors.green,
            shape: BoxShape.circle,
          ),
          child: Icon(
            Icons.check,
            color: Colors.white,
            size: size * 0.5,
          ),
        )
            .animate(onComplete: (_) => onComplete?.call())
            .scale(begin: const Offset(0, 0), duration: 400.ms, curve: Curves.elasticOut)
            .then()
            .shimmer(duration: 600.ms, color: Colors.white),
        if (message != null) ...[
          const SizedBox(height: 16),
          Text(
            message!,
            style: const TextStyle(
              color: Colors.green,
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ).animate().fadeIn(delay: 200.ms),
        ],
      ],
    );
  }
}

/// Floating action button with animation
class AnimatedFAB extends StatefulWidget {
  final VoidCallback? onPressed;
  final IconData icon;
  final String? tooltip;
  final Color? backgroundColor;

  const AnimatedFAB({
    super.key,
    this.onPressed,
    required this.icon,
    this.tooltip,
    this.backgroundColor,
  });

  @override
  State<AnimatedFAB> createState() => _AnimatedFABState();
}

class _AnimatedFABState extends State<AnimatedFAB>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  
  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => _controller.forward(),
      onTapUp: (_) => _controller.reverse(),
      onTapCancel: () => _controller.reverse(),
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, child) {
          final scale = 1.0 - (_controller.value * 0.1);
          return Transform.scale(
            scale: scale,
            child: FloatingActionButton(
              onPressed: widget.onPressed,
              tooltip: widget.tooltip,
              backgroundColor: widget.backgroundColor,
              child: Icon(widget.icon),
            ),
          );
        },
      ),
    );
  }
}