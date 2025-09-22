import 'package:json_annotation/json_annotation.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'post_entity.freezed.dart';
part 'post_entity.g.dart';

@freezed
class PostEntity with _$PostEntity {
  const factory PostEntity({
    required String id,
    required String userId,
    required String content,
    @Default([]) List<String> mediaUrls,
    @Default([]) List<String> likes,
    @Default(0) int commentsCount,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) = _PostEntity;

  factory PostEntity.fromJson(Map<String, dynamic> json) =>
      _$PostEntityFromJson(json);
}

@freezed
class CommentEntity with _$CommentEntity {
  const factory CommentEntity({
    required String id,
    required String postId,
    required String userId,
    required String content,
    DateTime? createdAt,
  }) = _CommentEntity;

  factory CommentEntity.fromJson(Map<String, dynamic> json) =>
      _$CommentEntityFromJson(json);
}

@freezed
class NotificationEntity with _$NotificationEntity {
  const factory NotificationEntity({
    required String id,
    required String toUserId,
    required String fromUserId,
    required String type, // 'like', 'comment', 'follow', 'mention'
    required String message,
    @Default({}) Map<String, dynamic> data,
    @Default(false) bool read,
    DateTime? createdAt,
  }) = _NotificationEntity;

  factory NotificationEntity.fromJson(Map<String, dynamic> json) =>
      _$NotificationEntityFromJson(json);
}