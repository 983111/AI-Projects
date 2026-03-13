import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'marketplace_screen.dart';
import 'outfit_composer_screen.dart';
import 'trend_detector_screen.dart';
import 'virtual_try_on_screen.dart';
import 'image_enhancer_screen.dart';
import 'profile_screen.dart'; // Added Profile Import

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 0;

  // Added ProfileScreen to the list of screens
  final List<Widget> _screens = [
    const MarketplaceScreen(),
    const OutfitComposerScreen(),
    const TrendDetectorScreen(),
    const VirtualTryOnScreen(),
    const ImageEnhancerScreen(),
    const ProfileScreen(), 
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Styfi',
          style: GoogleFonts.inter(
            fontWeight: FontWeight.bold,
            color: Theme.of(context).colorScheme.primary,
          ),
        ),
        backgroundColor: Colors.white.withOpacity(0.9),
        elevation: 0,
        centerTitle: false,
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (index) => setState(() => _currentIndex = index),
        backgroundColor: Colors.white,
        indicatorColor: Theme.of(context).colorScheme.secondary.withOpacity(0.3),
        // Added the Profile destination
        destinations: const [
          NavigationDestination(icon: Icon(Icons.shopping_bag_outlined), label: 'Shop'),
          NavigationDestination(icon: Icon(Icons.auto_awesome), label: 'Outfit'),
          NavigationDestination(icon: Icon(Icons.trending_up), label: 'Trends'),
          NavigationDestination(icon: Icon(Icons.camera_alt_outlined), label: 'Try-On'),
          NavigationDestination(icon: Icon(Icons.camera_enhance_outlined), label: 'Studio'),
          NavigationDestination(icon: Icon(Icons.person_outline), label: 'Profile'),
        ],
      ),
    );
  }
}