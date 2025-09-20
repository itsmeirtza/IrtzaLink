import 'package:flutter/material.dart';
import 'dart:math' as math;
import '../utils/design_system.dart';

class AnimatedIrtzaLinkLogo extends StatefulWidget {
  final double size;
  final bool showText;
  final bool autoAnimate;
  final Color? color;
  final VoidCallback? onTap;
  
  const AnimatedIrtzaLinkLogo({
    Key? key,
    this.size = 80.0,
    this.showText = true,
    this.autoAnimate = true,
    this.color,
    this.onTap,
  }) : super(key: key);

  @override
  State<AnimatedIrtzaLinkLogo> createState() => _AnimatedIrtzaLinkLogoState();
}

class _AnimatedIrtzaLinkLogoState extends State<AnimatedIrtzaLinkLogo>
    with TickerProviderStateMixin {
  late AnimationController _rotationController;
  late AnimationController _pulseController;
  late AnimationController _glowController;
  late AnimationController _bounceController;
  
  late Animation<double> _rotationAnimation;
  late Animation<double> _pulseAnimation;
  late Animation<double> _glowAnimation;
  late Animation<double> _bounceAnimation;
  late Animation<Color?> _colorAnimation;

  @override
  void initState() {
    super.initState();
    
    // Rotation animation for continuous spinning
    _rotationController = AnimationController(
      duration: const Duration(seconds: 8),
      vsync: this,
    );
    
    // Pulse animation for breathing effect
    _pulseController = AnimationController(
      duration: const Duration(milliseconds: 2000),
      vsync: this,
    );
    
    // Glow animation
    _glowController = AnimationController(
      duration: const Duration(milliseconds: 3000),
      vsync: this,
    );
    
    // Bounce animation for tap
    _bounceController = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );
    
    _rotationAnimation = Tween<double>(
      begin: 0,
      end: 2 * math.pi,
    ).animate(CurvedAnimation(
      parent: _rotationController,
      curve: Curves.linear,
    ));
    
    _pulseAnimation = Tween<double>(
      begin: 1.0,
      end: 1.1,
    ).animate(CurvedAnimation(
      parent: _pulseController,
      curve: Curves.easeInOut,
    ));
    
    _glowAnimation = Tween<double>(
      begin: 0.3,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _glowController,
      curve: Curves.easeInOut,
    ));
    
    _bounceAnimation = Tween<double>(
      begin: 1.0,
      end: 0.9,
    ).animate(CurvedAnimation(
      parent: _bounceController,
      curve: Curves.elasticOut,
    ));
    
    _colorAnimation = ColorTween(
      begin: DesignSystem.primaryBlue,
      end: DesignSystem.secondaryPurple,
    ).animate(_glowController);
    
    if (widget.autoAnimate) {
      _startAnimations();
    }
  }
  
  void _startAnimations() {
    _rotationController.repeat();
    _pulseController.repeat(reverse: true);
    _glowController.repeat(reverse: true);
  }
  
  void _stopAnimations() {
    _rotationController.stop();
    _pulseController.stop();
    _glowController.stop();
  }
  
  void _onTap() async {
    await _bounceController.forward();
    _bounceController.reverse();
    widget.onTap?.call();
  }

  @override
  void dispose() {
    _rotationController.dispose();
    _pulseController.dispose();
    _glowController.dispose();
    _bounceController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return GestureDetector(
      onTap: widget.onTap != null ? _onTap : null,
      child: AnimatedBuilder(
        animation: Listenable.merge([
          _rotationAnimation,
          _pulseAnimation,
          _glowAnimation,
          _bounceAnimation,
        ]),
        builder: (context, child) {
          return Transform.scale(
            scale: _bounceAnimation.value * _pulseAnimation.value,
            child: Container(
              width: widget.size * (widget.showText ? 3 : 1),
              height: widget.size,
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Animated Logo Icon
                  Container(
                    width: widget.size,
                    height: widget.size,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(widget.size * 0.2),
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [
                          _colorAnimation.value ?? DesignSystem.primaryBlue,
                          DesignSystem.secondaryPink,
                        ],
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: (_colorAnimation.value ?? DesignSystem.primaryBlue)
                              .withOpacity(_glowAnimation.value * 0.6),
                          blurRadius: 20 * _glowAnimation.value,
                          offset: const Offset(0, 5),
                        ),
                        BoxShadow(
                          color: DesignSystem.secondaryPink
                              .withOpacity(_glowAnimation.value * 0.4),
                          blurRadius: 30 * _glowAnimation.value,
                          offset: const Offset(0, 10),
                        ),
                      ],
                    ),
                    child: Stack(
                      children: [
                        // Background glow
                        Positioned.fill(
                          child: Container(
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(widget.size * 0.2),
                              gradient: LinearGradient(
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                                colors: [
                                  Colors.white.withOpacity(0.3),
                                  Colors.transparent,
                                ],
                              ),
                            ),
                          ),
                        ),
                        
                        // Chain link icon
                        Center(
                          child: Transform.rotate(
                            angle: _rotationAnimation.value * 0.1, // Subtle rotation
                            child: Icon(
                              Icons.link_rounded,
                              size: widget.size * 0.5,
                              color: Colors.white,
                            ),
                          ),
                        ),
                        
                        // Sparkle effects
                        ...List.generate(3, (index) {
                          final angle = (index * 120) + (_rotationAnimation.value * 60);
                          final radius = widget.size * 0.35;
                          final x = radius * math.cos(angle * math.pi / 180);
                          final y = radius * math.sin(angle * math.pi / 180);
                          
                          return Positioned(
                            left: (widget.size / 2) + x - 3,
                            top: (widget.size / 2) + y - 3,
                            child: AnimatedOpacity(
                              opacity: _glowAnimation.value,
                              duration: const Duration(milliseconds: 100),
                              child: Container(
                                width: 6,
                                height: 6,
                                decoration: const BoxDecoration(
                                  color: Colors.white,
                                  shape: BoxShape.circle,
                                ),
                              ),
                            ),
                          );
                        }),
                      ],
                    ),
                  ),
                  
                  // Animated Text
                  if (widget.showText) ...[
                    const SizedBox(width: 12),
                    ShaderMask(
                      shaderCallback: (bounds) {
                        return LinearGradient(
                          colors: [
                            _colorAnimation.value ?? DesignSystem.primaryBlue,
                            DesignSystem.secondaryPurple,
                            DesignSystem.secondaryPink,
                          ],
                        ).createShader(bounds);
                      },
                      child: Text(
                        'IrtzaLink',
                        style: TextStyle(
                          fontSize: widget.size * 0.4,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                          letterSpacing: -1,
                          shadows: [
                            Shadow(
                              color: (_colorAnimation.value ?? DesignSystem.primaryBlue)
                                  .withOpacity(0.5),
                              blurRadius: 10,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

// Compact Logo for App Bar
class CompactIrtzaLogo extends StatefulWidget {
  final double size;
  const CompactIrtzaLogo({Key? key, this.size = 32.0}) : super(key: key);

  @override
  State<CompactIrtzaLogo> createState() => _CompactIrtzaLogoState();
}

class _CompactIrtzaLogoState extends State<CompactIrtzaLogo>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: 1.05,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOut,
    ));
    _controller.repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _scaleAnimation,
      builder: (context, child) {
        return Transform.scale(
          scale: _scaleAnimation.value,
          child: Container(
            width: widget.size,
            height: widget.size,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(widget.size * 0.2),
              gradient: const LinearGradient(
                colors: [
                  DesignSystem.primaryBlue,
                  DesignSystem.secondaryPurple,
                ],
              ),
              boxShadow: [
                BoxShadow(
                  color: DesignSystem.primaryBlue.withOpacity(0.3),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Icon(
              Icons.link_rounded,
              size: widget.size * 0.6,
              color: Colors.white,
            ),
          ),
        );
      },
    );
  }
}

// Loading Logo Animation
class LoadingIrtzaLogo extends StatefulWidget {
  final double size;
  const LoadingIrtzaLogo({Key? key, this.size = 60.0}) : super(key: key);

  @override
  State<LoadingIrtzaLogo> createState() => _LoadingIrtzaLogoState();
}

class _LoadingIrtzaLogoState extends State<LoadingIrtzaLogo>
    with TickerProviderStateMixin {
  late AnimationController _spinController;
  late AnimationController _pulseController;
  late Animation<double> _spinAnimation;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    
    _spinController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    );
    
    _pulseController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    );
    
    _spinAnimation = Tween<double>(
      begin: 0,
      end: 2 * math.pi,
    ).animate(_spinController);
    
    _pulseAnimation = Tween<double>(
      begin: 0.8,
      end: 1.2,
    ).animate(CurvedAnimation(
      parent: _pulseController,
      curve: Curves.easeInOut,
    ));
    
    _spinController.repeat();
    _pulseController.repeat(reverse: true);
  }

  @override
  void dispose() {
    _spinController.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: Listenable.merge([_spinAnimation, _pulseAnimation]),
      builder: (context, child) {
        return Transform.scale(
          scale: _pulseAnimation.value,
          child: Transform.rotate(
            angle: _spinAnimation.value,
            child: Container(
              width: widget.size,
              height: widget.size,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: const LinearGradient(
                  colors: [
                    DesignSystem.primaryBlue,
                    DesignSystem.secondaryPurple,
                    DesignSystem.secondaryPink,
                  ],
                ),
                boxShadow: [
                  BoxShadow(
                    color: DesignSystem.primaryBlue.withOpacity(0.5),
                    blurRadius: 20,
                    offset: const Offset(0, 5),
                  ),
                ],
              ),
              child: Icon(
                Icons.link_rounded,
                size: widget.size * 0.5,
                color: Colors.white,
              ),
            ),
          ),
        );
      },
    );
  }
}