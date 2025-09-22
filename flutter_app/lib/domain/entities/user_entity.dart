import 'package:json_annotation/json_annotation.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'user_entity.freezed.dart';
part 'user_entity.g.dart';

@freezed
class UserEntity with _$UserEntity {
  const factory UserEntity({
    required String id,
    String? username,
    String? displayName,
    String? email,
    String? bio,
    String? photoUrl,
    @Default({}) Map<String, String> socialLinks,
    ContactInfo? contactInfo,
    @Default([]) List<String> followers,
    @Default([]) List<String> following,
    @Default('dark') String theme,
    String? profileUrl,
    @Default(true) bool isActive,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) = _UserEntity;

  factory UserEntity.fromJson(Map<String, dynamic> json) =>
      _$UserEntityFromJson(json);
}

@freezed
class ContactInfo with _$ContactInfo {
  const factory ContactInfo({
    String? phone,
    String? email,
    String? website,
  }) = _ContactInfo;

  factory ContactInfo.fromJson(Map<String, dynamic> json) =>
      _$ContactInfoFromJson(json);
}