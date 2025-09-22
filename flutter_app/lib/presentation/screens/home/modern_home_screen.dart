import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

class ModernHomeScreen extends StatelessWidget {
  const ModernHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            children: [
              _buildHeader(context),
              const SizedBox(height: 24),
              _buildFeedPlaceholder(context),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          const Text(
            'IrtzaLink',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
            ),
          ),
          const Spacer(),
          IconButton(
            onPressed: () {},
            icon: const Icon(Icons.notifications_outlined),
          ),
          IconButton(
            onPressed: () {},
            icon: const Icon(Icons.chat_bubble_outline),
          ),
        ],
      ),
    ).animate().fadeIn().slideX();
  }

  Widget _buildFeedPlaceholder(BuildContext context) {
    return Column(
      children: List.generate(3, (index) {
        return Container(
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Theme.of(context).cardColor,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 10,
                offset: const Offset(0, 5),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Social Feed Coming Soon!',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Enhanced social features with posts, likes, comments, and real-time interactions will be available here.',
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Icon(Icons.favorite_outline, color: Colors.grey[600]),
                  const SizedBox(width: 16),
                  Icon(Icons.chat_bubble_outline, color: Colors.grey[600]),
                  const SizedBox(width: 16),
                  Icon(Icons.share_outlined, color: Colors.grey[600]),
                ],
              ),
            ],
          ),
        ).animate(delay: (index * 200).ms).fadeIn().slideY(begin: 0.3);
      }),
    );
  }
}