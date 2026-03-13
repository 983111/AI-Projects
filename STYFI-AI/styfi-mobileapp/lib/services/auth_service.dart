// lib/services/auth_service.dart
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import '../models.dart';

class AuthService {
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;
  AuthService._internal();

  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  // Notifier for the UI to listen to role changes
  final ValueNotifier<UserRole> roleNotifier = ValueNotifier(UserRole.buyer);
  
  // Helper getter for UI (Fixes error in ProfileScreen)
  UserRole get currentRole => roleNotifier.value;

  Stream<User?> get authStateChanges => _auth.authStateChanges();
  User? get currentUser => _auth.currentUser;

  void init() {
    _auth.authStateChanges().listen((User? user) {
      if (user != null) {
        _db.collection('users').doc(user.uid).snapshots().listen((snapshot) {
          if (snapshot.exists) {
            final appUser = AppUser.fromMap(snapshot.data()!, snapshot.id);
            roleNotifier.value = appUser.role;
          }
        });
      } else {
        roleNotifier.value = UserRole.buyer;
      }
    });
  }

  // Wrappers to fix "Method not found" errors
  Future<void> switchToSeller() async {
    await switchRole(UserRole.seller);
  }

  Future<void> switchToBuyer() async {
    await switchRole(UserRole.buyer);
  }

  Future<void> switchRole(UserRole newRole) async {
    final user = _auth.currentUser;
    if (user != null) {
      await _db.collection('users').doc(user.uid).update({
        'role': newRole == UserRole.seller ? 'seller' : 'buyer'
      });
      // Optimistic update for immediate UI feedback
      roleNotifier.value = newRole;
    }
  }

  Future<String?> signUp(String email, String password) async {
    try {
      UserCredential result = await _auth.createUserWithEmailAndPassword(
        email: email, 
        password: password
      );
      await _db.collection('users').doc(result.user!.uid).set({
        'email': email,
        'role': 'buyer',
        'createdAt': FieldValue.serverTimestamp(),
      });
      return null;
    } on FirebaseAuthException catch (e) {
      return e.message;
    }
  }

  Future<String?> signIn(String email, String password) async {
    try {
      await _auth.signInWithEmailAndPassword(email: email, password: password);
      return null;
    } on FirebaseAuthException catch (e) {
      return e.message;
    }
  }

  Future<void> signOut() async {
    await _auth.signOut();
  }
<<<<<<< HEAD
}
=======
}
>>>>>>> 9b3456e6285ce023c13c7915bd9d5a11a4f51582
