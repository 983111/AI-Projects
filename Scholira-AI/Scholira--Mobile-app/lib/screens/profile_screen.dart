import 'package:flutter/material.dart';
import '../constants/app_colors.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              const SizedBox(height: 20),
              // Avatar
              Center(
                child: Stack(
                  alignment: Alignment.bottomRight,
                  children: [
                    Container(
                      width: 100, height: 100,
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        shape: BoxShape.circle,
                        boxShadow: [BoxShadow(color: AppColors.primary.withOpacity(0.3), blurRadius: 20, offset: const Offset(0, 10))]
                      ),
                      child: const Center(child: Text("AD", style: TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold))),
                    ),
                    Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
                      child: const Icon(Icons.check_circle, color: AppColors.success, size: 24),
                    )
                  ],
                ),
              ),
              const SizedBox(height: 16),
              const Text("Azizbek D.", style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.secondary)),
              const SizedBox(height: 4),
              const Text("STUDENT TIER • UZBEKISTAN", style: TextStyle(color: AppColors.textGrey, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1)),
              
              const SizedBox(height: 30),
              
              // Stats
              Row(
                children: [
                  Expanded(child: _statCard("12", "SAVED")),
                  const SizedBox(width: 16),
                  Expanded(child: _statCard("4", "APPLIED")),
                ],
              ),
              
              const SizedBox(height: 30),
              Align(alignment: Alignment.centerLeft, child: Text("ACTIVITY", style: TextStyle(color: AppColors.textGrey, fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 1))),
              const SizedBox(height: 16),
              
              _activityItem(Icons.verified_user_outlined, AppColors.success, "Profile Verified", "2 hours ago"),
              _activityItem(Icons.send_rounded, AppColors.primary, "Application Sent", "Yesterday"),
            ],
          ),
        ),
      ),
    );
  }

  Widget _statCard(String count, String label) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10)]
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(color: AppColors.textGrey, fontSize: 10, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text(count, style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: AppColors.secondary)),
        ],
      ),
    );
  }

  Widget _activityItem(IconData icon, Color color, String title, String time) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey[100]!),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: color.withOpacity(0.1), shape: BoxShape.circle),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.secondary)),
              const SizedBox(height: 2),
              Text(time, style: const TextStyle(color: AppColors.textGrey, fontSize: 12)),
            ],
          )
        ],
      ),
    );
  }
}