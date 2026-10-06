const Worker = require('../models/Worker');
const User = require('../models/User');

exports.signupWorker = async (req, res) => {
  try {
    const { name, email, phone, skills, services, experience, city, serviceAreas } = req.body;

    // First check if user exists, else create user with worker role
    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      user = await User.create({
        name,
        email: email.toLowerCase(),
        phone,
        role: 'worker'
      });
    } else {
      // Update role to worker if already exists as customer
      user.role = 'worker';
      user.name = name;
      user.phone = phone;
      await user.save();
    }

    const worker = await Worker.create({
      userId: user._id,
      name,
      email: email.toLowerCase(),
      phone,
      skills,
      services,
      experience,
      serviceAreas,
      verificationStatus: 'PENDING'
    });

    res.status(201).json({ 
      success: true, 
      message: 'Your application has been submitted. An admin will review your profile.',
      data: worker 
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getWorkers = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { verificationStatus: 'APPROVED' };
    const workers = await Worker.find(filter).populate('userId', 'email role isActive');
    res.status(200).json({ success: true, count: workers.length, data: workers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateVerificationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const worker = await Worker.findByIdAndUpdate(
      req.params.id, 
      { verificationStatus: status },
      { new: true, runValidators: true }
    );

    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }

    res.status(200).json({ success: true, data: worker });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
