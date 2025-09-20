import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/theme_service.dart';
import '../utils/design_system.dart';

class AnimatedThemeSwitcher extends StatefulWidget {
  final double? size;
  final bool showLabel;
  const AnimatedThemeSwitcher({
    Key? key,
    this.size,
    this.showLabel = false,
  }) : super(key: key);

  @override
  State<AnimatedThemeSwitcher> createState() => _AnimatedThemeSwitcherState();
}

class _AnimatedThemeSwitcherState extends State<AnimatedThemeSwitcher>
    with TickerProviderStateMixin {
  late AnimationController _controller;
  late AnimationController _bounceController;
  late Animation<double> _slideAnimation;
  late Animation<double> _rotationAnimation;
  late Animation<double> _scaleAnimation;
  late Animation<Color?> _colorAnimation;
  
  @override
  void initState() {
    super.initState();
    
    _controller = AnimationController(
      duration: DesignSystem.animationMedium,
      vsync: this,
    );
    
    _bounceController = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );
    
    _slideAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOutCubic,
    ));
    
    _rotationAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOutBack,
    ));
    
    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: 1.2,
    ).animate(CurvedAnimation(
      parent: _bounceController,
      curve: Curves.elasticOut,
    ));
    
    _colorAnimation = ColorTween(
      begin: DesignSystem.primaryBlue,
      end: DesignSystem.secondaryPurple,
    ).animate(_controller);
    
    // Set initial state based on current theme
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final themeService = Provider.of<ThemeService>(context, listen: false);
      if (themeService.isDarkMode) {
        _controller.forward();
      }
    });
  }
  
  @override
  void dispose() {
    _controller.dispose();
    _bounceController.dispose();
    super.dispose();
  }
  
  void _toggleTheme() async {
    final themeService = Provider.of<ThemeService>(context, listen: false);
    
    // Bounce animation
    await _bounceController.forward();
    _bounceController.reverse();
    
    // Toggle theme
    themeService.toggleTheme();
    
    // Slide animation
    if (themeService.isDarkMode) {
      _controller.forward();
    } else {
      _controller.reverse();
    }
  }
  
  @override
  Widget build(BuildContext context) {
    final size = widget.size ?? 60.0;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Consumer<ThemeService>(
      builder: (context, themeService, child) {
        return GestureDetector(
          onTap: _toggleTheme,
          child: AnimatedBuilder(
            animation: Listenable.merge([_controller, _scaleAnimation]),
            builder: (context, child) {
              return Transform.scale(
                scale: _scaleAnimation.value,
                child: Container(
                  width: size * 1.8,
                  height: size,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(size / 2),
                    gradient: LinearGradient(
                      colors: [
                        _colorAnimation.value ?? DesignSystem.primaryBlue,
                        isDark 
                          ? DesignSystem.secondaryPurple 
                          : DesignSystem.primaryBlue,
                      ],
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: (_colorAnimation.value ?? DesignSystem.primaryBlue)
                            .withOpacity(0.4),
                        blurRadius: 15,
                        offset: const Offset(0, 5),
                      ),
                    ],
                  ),
                  child: Stack(
                    children: [
                      // Background glow effect
                      Positioned.fill(
                        child: Container(
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(size / 2),
                            gradient: LinearGradient(
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                              colors: [
                                Colors.white.withOpacity(0.2),
                                Colors.transparent,
                              ],
                            ),
                          ),
                        ),
                      ),
                      
                      // Sliding circle
                      Positioned(
                        left: _slideAnimation.value * (size * 0.8),
                        top: size * 0.1,
                        child: AnimatedContainer(
                          duration: DesignSystem.animationMedium,
                          width: size * 0.8,
                          height: size * 0.8,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.2),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Transform.rotate(
                            angle: _rotationAnimation.value * 2 * 3.14159,
                            child: Icon(
                              themeService.isDarkMode 
                                ? Icons.dark_mode_rounded
                                : Icons.light_mode_rounded,
                              color: _colorAnimation.value ?? DesignSystem.primaryBlue,
                              size: size * 0.4,
                            ),
                          ),
                        ),
                      ),
                      
                      // Stars animation for dark mode
                      if (themeService.isDarkMode)
                        ...List.generate(3, (index) => 
                          Positioned(
                            left: (size * 0.2) + (index * size * 0.15),
                            top: size * 0.3,
                            child: AnimatedOpacity(
                              opacity: _slideAnimation.value,
                              duration: DesignSystem.animationMedium,
                              child: Icon(
                                Icons.star,
                                color: Colors.white.withOpacity(0.8),
                                size: size * 0.1,
                              ),
                            ),
                          ),
                        ),
                      
                      // Sun rays for light mode
                      if (!themeService.isDarkMode)
                        ...List.generate(4, (index) => 
                          Positioned(
                            right: (size * 0.15) + (index * size * 0.1),
                            top: size * 0.25 + (index % 2 * size * 0.2),
                            child: AnimatedOpacity(
                              opacity: 1 - _slideAnimation.value,
                              duration: DesignSystem.animationMedium,
                              child: Container(
                                width: size * 0.08,
                                height: size * 0.08,
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.9),
                                  shape: BoxShape.circle,
                                ),
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }
}

// Compact Theme Switcher for App Bar
class CompactThemeSwitcher extends StatefulWidget {
  const CompactThemeSwitcher({Key? key}) : super(key: key);

  @override
  State<CompactThemeSwitcher> createState() => _CompactThemeSwitcherState();
}

class _CompactThemeSwitcherState extends State<CompactThemeSwitcher>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  
  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 150),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: 0.8,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOut,
    ));
  }
  
  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
  
  void _onTapDown(TapDownDetails details) {
    _controller.forward();
  }
  
  void _onTapUp(TapUpDetails details) {
    _controller.reverse();
  }
  
  void _onTapCancel() {
    _controller.reverse();
  }
  
  @override
  Widget build(BuildContext context) {
    return Consumer<ThemeService>(
      builder: (context, themeService, child) {
        return GestureDetector(
          onTapDown: _onTapDown,
          onTapUp: _onTapUp,
          onTapCancel: _onTapCancel,
          onTap: () {
            themeService.toggleTheme();
          },
          child: AnimatedBuilder(
            animation: _scaleAnimation,
            builder: (context, child) {
              return Transform.scale(
                scale: _scaleAnimation.value,
                child: Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: themeService.isDarkMode 
                      ? DesignSystem.cardDark.withOpacity(0.8)
                      : DesignSystem.cardLight.withOpacity(0.8),
                    borderRadius: BorderRadius.circular(DesignSystem.radiusMedium),
                    border: Border.all(
                      color: themeService.isDarkMode 
                        ? DesignSystem.borderDark
                        : DesignSystem.borderLight,
                      width: 1,
                    ),
                    boxShadow: DesignSystem.shadowSmall,
                  ),
                  child: AnimatedSwitcher(
                    duration: DesignSystem.animationMedium,
                    transitionBuilder: (child, animation) {
                      return RotationTransition(
                        turns: animation,
                        child: child,
                      );
                    },
                    child: Icon(
                      themeService.isDarkMode 
                        ? Icons.dark_mode_rounded
                        : Icons.light_mode_rounded,
                      key: ValueKey(themeService.isDarkMode),
                      color: themeService.isDarkMode 
                        ? DesignSystem.textDark
                        : DesignSystem.textPrimary,
                      size: 20,
                    ),
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }
}

// Floating Theme Switcher Button
class FloatingThemeSwitcher extends StatefulWidget {
  const FloatingThemeSwitcher({Key? key}) : super(key: key);

  @override
  State<FloatingThemeSwitcher> createState() => _FloatingThemeSwitcherState();
}

class _FloatingThemeSwitcherState extends State<FloatingThemeSwitcher>
    with TickerProviderStateMixin {
  late AnimationController _controller;
  late AnimationController _rippleController;
  late Animation<double> _scaleAnimation;
  late Animation<double> _rippleAnimation;
  
  @override
  void initState() {
    super.initState();
    
    _controller = AnimationController(
      duration: DesignSystem.animationMedium,
      vsync: this,
    );
    
    _rippleController = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );
    
    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: 1.1,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOut,
    ));
    
    _rippleAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _rippleController,
      curve: Curves.easeOut,
    ));
  }
  
  @override
  void dispose() {
    _controller.dispose();
    _rippleController.dispose();
    super.dispose();
  }
  
  void _handleTap() async {
    _rippleController.forward().then((_) {
      _rippleController.reset();
    });
    
    await _controller.forward();
    _controller.reverse();
    
    if (mounted) {
      Provider.of<ThemeService>(context, listen: false).toggleTheme();
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Consumer<ThemeService>(
      builder: (context, themeService, child) {
        return AnimatedBuilder(
          animation: Listenable.merge([_scaleAnimation, _rippleAnimation]),
          builder: (context, child) {
            return Transform.scale(
              scale: _scaleAnimation.value,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  // Ripple effect
                  if (_rippleAnimation.value > 0)
                    Container(
                      width: 56 * (1 + _rippleAnimation.value * 2),
                      height: 56 * (1 + _rippleAnimation.value * 2),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: (themeService.isDarkMode 
                            ? DesignSystem.secondaryPurple
                            : DesignSystem.primaryBlue).withOpacity(
                              0.3 * (1 - _rippleAnimation.value)
                            ),
                          width: 2,
                        ),
                      ),
                    ),
                  
                  // Main button
                  Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      gradient: themeService.isDarkMode 
                        ? DesignSystem.purpleGradient
                        : DesignSystem.blueGradient,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: (themeService.isDarkMode 
                            ? DesignSystem.secondaryPurple
                            : DesignSystem.primaryBlue).withOpacity(0.4),
                          blurRadius: 15,
                          offset: const Offset(0, 5),
                        ),
                      ],
                    ),
                    child: Material(
                      color: Colors.transparent,
                      child: InkWell(
                        borderRadius: BorderRadius.circular(28),
                        onTap: _handleTap,
                        child: AnimatedSwitcher(
                          duration: DesignSystem.animationMedium,
                          transitionBuilder: (child, animation) {
                            return ScaleTransition(
                              scale: animation,
                              child: RotationTransition(
                                turns: animation,
                                child: child,
                              ),
                            );
                          },
                          child: Icon(
                            themeService.isDarkMode 
                              ? Icons.nightlight_round
                              : Icons.wb_sunny_rounded,
                            key: ValueKey(themeService.isDarkMode),
                            color: Colors.white,
                            size: 24,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }
}