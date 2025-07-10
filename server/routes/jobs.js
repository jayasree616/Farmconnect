const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const User = require('../models/User');
const verifyToken = require('../middleware/authMiddleware');

// ✅ GET all jobs
router.get('/', async (req, res) => {
  try {
    const jobs = await Job.find();
    res.json(jobs);
  } catch (err) {
    console.error('Fetch jobs error:', err);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// ✅ POST a new job (only for farmers)
router.post('/', verifyToken, async (req, res) => {
  if (!req.user || req.user.role !== 'farmer') {
    return res.status(403).json({ error: 'Only farmers can post jobs' });
  }

  const { farmerName, location, workType, date, wage } = req.body;

  if (!farmerName || !location || !workType || !date || !wage) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const newJob = new Job({
      farmerName,
      location,
      workType,
      date,
      wage,
      postedBy: req.user.email // helpful for ownership check later
    });

    await newJob.save();
    res.status(201).json(newJob);
  } catch (err) {
    console.error('Post job error:', err);
    res.status(500).json({ error: 'Failed to post job' });
  }
});

// ✅ DELETE a job by ID (only by farmers)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (req.user.role !== 'farmer') {
      return res.status(403).json({ error: 'Only farmers can delete jobs' });
    }

    // Optional: Only allow the farmer who created the job to delete it
    // if (job.postedBy !== req.user.email) {
    //   return res.status(403).json({ error: 'You can only delete your own jobs' });
    // }

    await Job.findByIdAndDelete(req.params.id);
    res.json({ message: 'Job deleted' });
  } catch (err) {
    console.error('Delete job error:', err);
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

// ✅ APPLY to a job (only by laborers)
router.post('/:id/apply', verifyToken, async (req, res) => {
  if (!req.user || req.user.role !== 'laborer') {
    return res.status(403).json({ error: 'Only laborers can apply to jobs' });
  }

  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const alreadyApplied = job.applicants.some(app => app.email === req.user.email);
    if (alreadyApplied) {
      return res.status(400).json({ error: 'Already applied to this job' });
    }

    const applicant = await User.findOne({ email: req.user.email });
    if (!applicant) {
      return res.status(404).json({ error: 'Applicant not found' });
    }

    job.applicants.push({ email: applicant.email, contact: applicant.contact });
    await job.save();

    res.json({ message: 'Application successful' });
  } catch (err) {
    console.error('Apply error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});
// ✅ GET a job by ID (needed for editing)
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (err) {
    console.error('Fetch job by ID error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Accept an applicant (only farmer)
router.post('/:jobId/accept', verifyToken, async (req, res) => {
  const { email } = req.body; // laborer's email
  const jobId = req.params.jobId;

  try {
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ error: "Job not found" });

    if (req.user.role !== "farmer") {
      return res.status(403).json({ error: "Only farmers can accept applicants" });
    }

    const applicant = job.applicants.find(app => app.email === email);
    if (!applicant) return res.status(404).json({ error: "Applicant not found" });

    applicant.accepted = true; // ✅ Mark as accepted
    await job.save();

    res.json({ message: "Applicant accepted" });
  } catch (err) {
    console.error("Accept error:", err);
    res.status(500).json({ error: "Server error" });
  }
});
// UPDATE a job by ID (only farmers)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });

    if (req.user.role !== 'farmer') {
      return res.status(403).json({ error: "Only farmers can update jobs" });
    }

    const { location, workType, date, wage } = req.body;
    job.location = location;
    job.workType = workType;
    job.date = date;
    job.wage = wage;

    await job.save();
    res.json({ message: "Job updated successfully", job });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: "Failed to update job" });
  }
});


module.exports = router;
