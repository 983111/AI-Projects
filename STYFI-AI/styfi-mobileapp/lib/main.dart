import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:google_fonts/google_fonts.dart';
import 'services/auth_service.dart';
import 'screens/home_screen.dart';
import 'screens/seller_dashboard.dart';
import 'screens/login_screen.dart';
import 'models.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(); // Initialize Firebase
  
  // Start listening to user role changes
  AuthService().init();
  
  runApp(const StyfiApp());
}

class StyfiApp extends StatelessWidget {
  const StyfiApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Styfi',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFE11D48), 
          primary: const Color(0xFFE11D48),
          secondary: const Color(0xFFFDA4AF),
          surface: const Color(0xFFFFF1F2), 
        ),
        useMaterial3: true,
        textTheme: GoogleFonts.interTextTheme(),
        scaffoldBackgroundColor: const Color(0xFFFFF1F2),
      ),
      // Auth Wrapper
      home: StreamBuilder(
        stream: AuthService().authStateChanges,
        builder: (context, snapshot) {
          // If logged in
          if (snapshot.hasData) {
            return const RoleManager();
          }
          // If not logged in
          return const LoginScreen();
        },
      ),
<<<<<<< HEAD
=======
    );
  }
}

class RoleManager extends StatelessWidget {
  const RoleManager({super.key});

  @override
  Widget build(BuildContext context) {
    // Listen to the role stored in AuthService (fetched from Firestore)
    return ValueListenableBuilder<UserRole>(
      valueListenable: AuthService().roleNotifier,
      builder: (context, role, _) {
        if (role == UserRole.buyer) {
          return const MainScreen();
        } else {
          return const SellerDashboardScreen();
        }
      },
>>>>>>> 9b3456e6285ce023c13c7915bd9d5a11a4f51582
    );
  }
}

class RoleManager extends StatelessWidget {
  const RoleManager({super.key});

  @override
  Widget build(BuildContext context) {
    // Listen to the role stored in AuthService (fetched from Firestore)
    return ValueListenableBuilder<UserRole>(
      valueListenable: AuthService().roleNotifier,
      builder: (context, role, _) {
        if (role == UserRole.buyer) {
          return const MainScreen();
        } else {
          return const SellerDashboardScreen();
        }
      },
    );
  }
}