import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../services/follow_service.dart';

class FollowButton extends ConsumerStatefulWidget {
  const FollowButton({super.key, required this.targetUid, required this.targetUsername});
  final String targetUid;
  final String? targetUsername;

  @override
  ConsumerState<FollowButton> createState() => _FollowButtonState();
}

class _FollowButtonState extends ConsumerState<FollowButton> {
  bool _busy = false;

  @override
  Widget build(BuildContext context) {
    final currentUid = FirebaseAuth.instance.currentUser?.uid;
    if (currentUid == null || currentUid == widget.targetUid) return const SizedBox.shrink();
    final relationship = ref.watch(_relationshipProvider((currentUid, widget.targetUid)));

    return relationship.when(
      loading: () => _buildBtn(context, label: '...', icon: Icons.hourglass_empty, style: _BtnStyle.neutral, onPressed: null, tooltip: 'Checking...'),
      error: (e, st) => _buildBtn(context, label: 'Follow', icon: Icons.person_add, style: _BtnStyle.primary, onPressed: _busy ? null : () => _follow(currentUid), tooltip: 'Follow'),
      data: (rel) {
        switch (rel) {
          case 'following':
            return _buildBtn(context, label: 'Following', hoverLabel: 'Unfollow', icon: Icons.check, style: _BtnStyle.neutral, onPressed: _busy ? null : () => _unfollow(currentUid), tooltip: 'Unfollow');
          case 'follower':
            return _buildBtn(context, label: 'Follow Back', icon: Icons.person_add, style: _BtnStyle.primary, onPressed: _busy ? null : () => _follow(currentUid), tooltip: 'Follow Back');
          case 'friends':
            return _buildBtn(context, label: 'Friends', hoverLabel: 'Unfollow', icon: Icons.check, style: _BtnStyle.neutral, onPressed: _busy ? null : () => _unfollow(currentUid), tooltip: 'Unfollow');
          case 'none':
          default:
            return _buildBtn(context, label: 'Follow', icon: Icons.person_add, style: _BtnStyle.primary, onPressed: _busy ? null : () => _follow(currentUid), tooltip: 'Follow');
        }
      },
    );
  }

  Future<void> _follow(String currentUid) async {
    setState(() => _busy = true);
    try {
      await ref.read(followServiceProvider).follow(currentUid, widget.targetUid);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _unfollow(String currentUid) async {
    setState(() => _busy = true);
    try {
      await ref.read(followServiceProvider).unfollow(currentUid, widget.targetUid);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Widget _buildBtn(BuildContext context, {required String label, String? hoverLabel, required IconData icon, required _BtnStyle style, VoidCallback? onPressed, required String tooltip}) {
    final colorScheme = Theme.of(context).colorScheme;

    final bg = switch (style) {
      _BtnStyle.primary => colorScheme.primary,
      _BtnStyle.neutral => colorScheme.surfaceVariant,
    };
    final fg = switch (style) {
      _BtnStyle.primary => colorScheme.onPrimary,
      _BtnStyle.neutral => colorScheme.onSurfaceVariant,
    };

    return Tooltip(
      message: tooltip,
      child: TweenAnimationBuilder<double>(
        duration: const Duration(milliseconds: 250),
        tween: Tween(begin: 0, end: _busy ? 1 : 0),
        builder: (context, t, child) {
          // Subtle 3D tilt while processing
          final tilt = _busy ? 0.06 : 0.0;
          return Transform(
            alignment: Alignment.center,
            transform: Matrix4.identity()
              ..setEntry(3, 2, 0.001)
              ..rotateY(tilt),
            child: child,
          );
        },
        child: ElevatedButton.icon(
          onPressed: onPressed,
          icon: _busy
              ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
              : Icon(icon, size: 16),
          label: AnimatedSwitcher(
            duration: const Duration(milliseconds: 180),
            transitionBuilder: (c, a) => SizeTransition(sizeFactor: a, axis: Axis.horizontal, child: c),
            child: Text(label, key: ValueKey(label)),
          ),
          style: ElevatedButton.styleFrom(
            backgroundColor: bg,
            foregroundColor: fg,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        ),
      ),
    );
  }
}

enum _BtnStyle { primary, neutral }

final _relationshipProvider = StreamProvider.family<String, (String, String)>((ref, pair) {
  final (a, b) = pair;
  return ref.watch(followServiceProvider).relationship(a, b);
});
