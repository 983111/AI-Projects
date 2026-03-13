import 'package:flutter/material.dart';
import '../constants/app_colors.dart';
import 'home_screen.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  
  // Data State
  String _educationLevel = "Bachelor";
  String _selectedField = "IT & CS";
  final List<String> _goals = [];
  final List<String> _selectedDestinations = [];
  
  // Hardcoded for demo/API
  final String _gpa = "3.8";
  final String _sat = "1450";
  final String _toefl = "105";

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background, // Light background from screenshots
      body: SafeArea(
        child: Column(
          children: [
            // Custom Top Navigation Bar (Matches screenshot 1)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
              child: Row(
                children: [
                  Expanded(
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(4, (index) => _buildStepIndicator(index)),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20)),
                    child: const Row(children: [Icon(Icons.translate, size: 16), SizedBox(width: 4), Text("EN", style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold))]),
                  )
                ],
              ),
            ),
            
            // Content
            Expanded(
              child: PageView(
                controller: _pageController,
                physics: const NeverScrollableScrollPhysics(),
                onPageChanged: (p) => setState(() => _currentPage = p),
                children: [
                  _buildStep1Personal(),
                  _buildStep2Education(),
                  _buildStep3Goals(),
                  _buildStep4Countries(),
                ],
              ),
            ),

            // Bottom Buttons
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(30)),
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 20, offset: const Offset(0, -5))]
              ),
              child: Column(
                children: [
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 18),
                        elevation: 0,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                      ),
                      onPressed: _nextPage,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(_currentPage == 3 ? "FINISH" : "CONTINUE", style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 1)),
                          const SizedBox(width: 8),
                          const Icon(Icons.arrow_forward_rounded, size: 20),
                        ],
                      ),
                    ),
                  ),
                  if (_currentPage == 0) ...[
                    const SizedBox(height: 16),
                    GestureDetector(
                      onTap: () => _finishSetup(), // Skip
                      child: const Text("Skip for now", style: TextStyle(color: AppColors.textGrey, fontWeight: FontWeight.w600)),
                    )
                  ] else ...[
                    const SizedBox(height: 16),
                    GestureDetector(
                      onTap: () => _pageController.previousPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut),
                      child: const Text("Back", style: TextStyle(color: AppColors.textGrey, fontWeight: FontWeight.w600)),
                    )
                  ]
                ],
              ),
            )
          ],
        ),
      ),
    );
  }

  void _nextPage() {
    if (_currentPage < 3) {
      _pageController.nextPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
    } else {
      _finishSetup();
    }
  }

  void _finishSetup() {
    Navigator.pushReplacement(
      context, 
      MaterialPageRoute(builder: (context) => MainNavigationWrapper(
        gpa: _gpa, sat: _sat, toefl: _toefl, 
        educationLevel: _educationLevel, 
        fieldOfStudy: _selectedField, 
        targetCountries: _selectedDestinations
      ))
    );
  }

  // --- WIDGETS ---

  Widget _buildStepIndicator(int index) {
    bool isActive = index == _currentPage;
    bool isPast = index < _currentPage;
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 4),
      width: 35, height: 35,
      decoration: BoxDecoration(
        color: isActive ? AppColors.primary : (isPast ? AppColors.primary : Colors.white),
        shape: BoxShape.circle,
        border: Border.all(color: isActive || isPast ? AppColors.primary : Colors.grey[300]!),
      ),
      child: Center(
        child: isPast 
          ? const Icon(Icons.check, color: Colors.white, size: 16)
          : Text("${index + 1}", style: TextStyle(color: isActive ? Colors.white : Colors.grey, fontWeight: FontWeight.bold)),
      ),
    );
  }

  // Step 1: Personal Info
  Widget _buildStep1Personal() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 20),
          const Text("Personal\nInformation", style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, height: 1.2, color: AppColors.secondary)),
          const SizedBox(height: 10),
          const Text("Welcome to Scholira AI ecosystem!", style: TextStyle(color: AppColors.textGrey, fontSize: 16)),
          const SizedBox(height: 40),
          _customTextField("Full Name", Icons.person_outline, _nameController),
          const SizedBox(height: 16),
          _customTextField("Email Address", Icons.email_outlined, _emailController),
          const SizedBox(height: 16),
          _customTextField("Age", Icons.calendar_today_outlined, null),
        ],
      ),
    );
  }

  // Step 2: Education
  Widget _buildStep2Education() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 20),
          const Text("Education & Field", style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: AppColors.secondary)),
          const SizedBox(height: 30),
          _sectionTitle("EDUCATION LEVEL"),
          _gridOptions(["High School", "Bachelor", "Master", "PhD"], _educationLevel, (val) => setState(() => _educationLevel = val)),
          const SizedBox(height: 30),
          _sectionTitle("FIELD OF STUDY"),
          _gridOptions(["IT & CS", "Business", "Engineering", "Medical", "Arts"], _selectedField, (val) => setState(() => _selectedField = val)),
        ],
      ),
    );
  }

  // Step 3: Goals
  Widget _buildStep3Goals() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 20),
          const Text("Main Goals", style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: AppColors.secondary)),
          const SizedBox(height: 30),
          _goalCard("Full Grant", Icons.verified_user_outlined),
          _goalCard("Internship", Icons.work_outline),
          _goalCard("Learn Language", Icons.language),
          _goalCard("Networking", Icons.people_outline),
        ],
      ),
    );
  }

  // Step 4: Countries
  Widget _buildStep4Countries() {
    final countries = ["USA", "Germany", "UK", "Korea", "Turkey", "China", "Japan"];
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 20),
          const Text("Target Countries", style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: AppColors.secondary)),
          const SizedBox(height: 30),
          Expanded(
            child: GridView.builder(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, childAspectRatio: 1.4, crossAxisSpacing: 16, mainAxisSpacing: 16),
              itemCount: countries.length,
              itemBuilder: (context, index) {
                final country = countries[index];
                final isSelected = _selectedDestinations.contains(country);
                return GestureDetector(
                  onTap: () => setState(() => isSelected ? _selectedDestinations.remove(country) : _selectedDestinations.add(country)),
                  child: Container(
                    decoration: BoxDecoration(
                      color: isSelected ? AppColors.primary : Colors.white,
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)],
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.public, color: isSelected ? Colors.white : Colors.grey[400], size: 28),
                        const SizedBox(height: 8),
                        Text(country, style: TextStyle(color: isSelected ? Colors.white : AppColors.secondary, fontWeight: FontWeight.bold, fontSize: 16)),
                      ],
                    ),
                  ),
                );
              },
            ),
          )
        ],
      ),
    );
  }

  // Helpers
  Widget _customTextField(String hint, IconData icon, TextEditingController? controller) {
    return Container(
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20)),
      child: TextField(
        controller: controller,
        decoration: InputDecoration(
          hintText: hint,
          prefixIcon: Icon(icon, color: AppColors.textGrey),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide.none),
          filled: true, fillColor: Colors.white,
          contentPadding: const EdgeInsets.symmetric(vertical: 20)
        ),
      ),
    );
  }

  Widget _sectionTitle(String title) => Padding(padding: const EdgeInsets.only(bottom: 12), child: Text(title, style: const TextStyle(color: AppColors.textGrey, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.2)));

  Widget _gridOptions(List<String> items, String selected, Function(String) onSelect) {
    return Wrap(
      spacing: 12, runSpacing: 12,
      children: items.map((item) {
        bool isSel = selected == item;
        return GestureDetector(
          onTap: () => onSelect(item),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
            decoration: BoxDecoration(
              color: isSel ? Colors.white : Colors.white,
              borderRadius: BorderRadius.circular(30),
              border: Border.all(color: isSel ? AppColors.primary : Colors.transparent, width: 2),
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 5)]
            ),
            child: Text(item, style: TextStyle(color: isSel ? AppColors.primary : AppColors.secondary, fontWeight: FontWeight.w600)),
          ),
        );
      }).toList(),
    );
  }

  Widget _goalCard(String title, IconData icon) {
    bool isSel = _goals.contains(title);
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: GestureDetector(
        onTap: () => setState(() => isSel ? _goals.remove(title) : _goals.add(title)),
        child: Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: isSel ? AppColors.primary : Colors.transparent, width: 2),
          ),
          child: Row(
            children: [
              Icon(icon, color: isSel ? AppColors.primary : AppColors.textGrey),
              const SizedBox(width: 16),
              Text(title, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: isSel ? AppColors.secondary : AppColors.textGrey)),
            ],
          ),
        ),
      ),
    );
  }
}