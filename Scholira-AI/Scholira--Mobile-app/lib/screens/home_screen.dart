import 'package:flutter/material.dart';
import '../constants/app_colors.dart';
import '../models/scholarship.dart';
import '../services/api_service.dart';
import '../widgets/scholarship_card.dart';
import 'profile_screen.dart';

class MainNavigationWrapper extends StatefulWidget {
  final String gpa, sat, toefl, educationLevel, fieldOfStudy;
  final List<String> targetCountries;
  const MainNavigationWrapper({super.key, required this.gpa, required this.sat, required this.toefl, required this.educationLevel, required this.fieldOfStudy, required this.targetCountries});

  @override
  State<MainNavigationWrapper> createState() => _MainNavigationWrapperState();
}

class _MainNavigationWrapperState extends State<MainNavigationWrapper> {
  int _currentIndex = 0;
  late List<Widget> _screens;

  @override
  void initState() {
    super.initState();
    _screens = [
      HomeScreen(gpa: widget.gpa, sat: widget.sat, toefl: widget.toefl, educationLevel: widget.educationLevel, fieldOfStudy: widget.fieldOfStudy, targetCountries: widget.targetCountries),
      const Center(child: Text("Saved (Coming Soon)")),
      const ProfileScreen(),
    ];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _screens[_currentIndex],
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -5))]
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (i) => setState(() => _currentIndex = i),
          selectedItemColor: AppColors.primary,
          unselectedItemColor: Colors.grey[400],
          showSelectedLabels: false, showUnselectedLabels: false,
          elevation: 0, backgroundColor: Colors.transparent,
          items: const [
            BottomNavigationBarItem(icon: Icon(Icons.home_rounded, size: 28), label: "Home"),
            BottomNavigationBarItem(icon: Icon(Icons.bookmark_rounded, size: 28), label: "Saved"),
            BottomNavigationBarItem(icon: Icon(Icons.person_rounded, size: 28), label: "Profile"),
          ],
        ),
      ),
    );
  }
}

class HomeScreen extends StatefulWidget {
  final String gpa, sat, toefl, educationLevel, fieldOfStudy;
  final List<String> targetCountries;
  const HomeScreen({super.key, required this.gpa, required this.sat, required this.toefl, required this.educationLevel, required this.fieldOfStudy, required this.targetCountries});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  late Future<List<Scholarship>> _futureScholarships;

  @override
  void initState() {
    super.initState();
    _futureScholarships = ApiService().fetchScholarships(
      gpa: widget.gpa, sat: widget.sat, toefl: widget.toefl, 
      educationLevel: widget.educationLevel, fieldOfStudy: widget.fieldOfStudy, 
      targetCountries: widget.targetCountries
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            children: [
              const SizedBox(height: 20),
              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Row(children: [
                    CircleAvatar(backgroundColor: AppColors.primary, radius: 18, child: Icon(Icons.school, color: Colors.white, size: 20)),
                    SizedBox(width: 12),
                    Text("EduFund AI", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.secondary)),
                  ]),
                  Icon(Icons.notifications_none_rounded, color: Colors.grey[400])
                ],
              ),
              const SizedBox(height: 24),
              
              // Search Bar
              Row(
                children: [
                  Expanded(
                    child: Container(
                      height: 50,
                      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
                      child: TextField(
                        decoration: InputDecoration(
                          hintText: "Search programs...",
                          hintStyle: TextStyle(color: Colors.grey[400]),
                          prefixIcon: Icon(Icons.search, color: Colors.grey[400]),
                          border: InputBorder.none, contentPadding: const EdgeInsets.only(top: 12)
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Container(
                    height: 50, width: 50,
                    decoration: BoxDecoration(color: AppColors.secondary, borderRadius: BorderRadius.circular(16)),
                    child: const Icon(Icons.tune, color: Colors.white, size: 20),
                  )
                ],
              ),
              
              const SizedBox(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: const [
                  Text("FEATURED", style: TextStyle(color: AppColors.textGrey, fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 1)),
                  Text("See all", style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 14)),
                ],
              ),
              const SizedBox(height: 16),

              // List
              Expanded(
                child: FutureBuilder<List<Scholarship>>(
                  future: _futureScholarships,
                  builder: (context, snapshot) {
                    if (snapshot.connectionState == ConnectionState.waiting) return const Center(child: CircularProgressIndicator(color: AppColors.primary));
                    if (!snapshot.hasData || snapshot.data!.isEmpty) return const Center(child: Text("No scholarships found."));
                    
                    return ListView.builder(
                      itemCount: snapshot.data!.length,
                      itemBuilder: (context, index) => ScholarshipCard(scholarship: snapshot.data![index]),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}