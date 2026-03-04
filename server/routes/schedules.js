import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// All routes are protected with JWT middleware
router.use(authenticateToken);

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Apply admin middleware to all routes
router.use(requireAdmin);

// GET /api/schedules - Get all schedules with filtering
router.get('/', async (req, res) => {
  try {
    console.log('Schedules API called with query:', req.query);
    const { 
      laboratoryId, 
      instructorId, 
      day, 
      semester, 
      year,
      page = 1, 
      limit = 50 
    } = req.query;
    
    const whereClause = {};
    if (laboratoryId) whereClause.laboratoryId = parseInt(laboratoryId);
    if (instructorId) whereClause.instructorId = parseInt(instructorId);
    if (day) whereClause.day = day;
    
    // Add semester filtering if provided
    if (semester && year) {
      // For now, we'll filter by createdAt date range based on semester
      // In a real implementation, you might want to add semester/year fields to the model
      const semesterStart = new Date(`${year}-${getSemesterStartMonth(semester)}-01`);
      const semesterEnd = new Date(`${year}-${getSemesterEndMonth(semester)}-31`);
      whereClause.createdAt = {
        gte: semesterStart,
        lte: semesterEnd
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [schedules, totalCount] = await Promise.all([
      prisma.labSchedule.findMany({
        where: whereClause,
        include: {
          laboratory: {
            select: {
              id: true,
              name: true,
              roomNumber: true,
              building: true
            }
          },
          instructor: {
            select: {
              id: true,
              fullName: true,
              username: true,
              email: true
            }
          }
        },
        orderBy: [
          { day: 'asc' },
          { startTime: 'asc' }
        ],
        skip,
        take: parseInt(limit)
      }),
      prisma.labSchedule.count({ where: whereClause })
    ]);

    res.json({
      success: true,
      data: schedules,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    });
    console.log('Schedules sent:', schedules.length);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch schedules' });
  }
});

// GET /api/schedules/:id - Get single schedule
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const schedule = await prisma.labSchedule.findUnique({
      where: { id: parseInt(id) },
      include: {
        laboratory: {
          select: {
            id: true,
            name: true,
            roomNumber: true,
            building: true
          }
        },
        instructor: {
          select: {
            id: true,
            fullName: true,
            username: true,
            email: true
          }
        }
      }
    });

    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }

    res.json({ success: true, data: schedule });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch schedule' });
  }
});

// POST /api/schedules - Create new schedule
router.post('/', async (req, res) => {
  try {
    const { 
      laboratoryId, 
      instructorId, 
      day, 
      startTime, 
      endTime, 
      className, 
      subjectCode 
    } = req.body;

    // Validation
    if (!laboratoryId || !instructorId || !day || !startTime || !endTime || !className || !subjectCode) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    // Validate day
    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    if (!validDays.includes(day)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid day. Must be one of: ' + validDays.join(', ') 
      });
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid time format. Use HH:MM (24-hour format)' 
      });
    }

    // Validate end time is after start time
    if (startTime >= endTime) {
      return res.status(400).json({ 
        success: false, 
        message: 'End time must be after start time' 
      });
    }

    // Check if laboratory exists
    const laboratory = await prisma.laboratory.findUnique({
      where: { id: parseInt(laboratoryId) }
    });

    if (!laboratory) {
      return res.status(400).json({ 
        success: false, 
        message: 'Laboratory not found' 
      });
    }

    // Check if instructor exists and is an instructor
    const instructor = await prisma.user.findUnique({
      where: { id: parseInt(instructorId) }
    });

    if (!instructor || instructor.role !== 'INSTRUCTOR') {
      return res.status(400).json({ 
        success: false, 
        message: 'Instructor not found or invalid role' 
      });
    }

    // Check for schedule conflicts
    const conflicts = await checkScheduleConflicts({
      laboratoryId: parseInt(laboratoryId),
      instructorId: parseInt(instructorId),
      day,
      startTime,
      endTime,
      excludeId: null
    });

    if (conflicts.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Schedule conflict detected', 
        conflicts 
      });
    }

    // Create schedule
    const schedule = await prisma.labSchedule.create({
      data: {
        laboratoryId: parseInt(laboratoryId),
        instructorId: parseInt(instructorId),
        day,
        startTime,
        endTime,
        className,
        subjectCode
      },
      include: {
        laboratory: {
          select: {
            id: true,
            name: true,
            roomNumber: true,
            building: true
          }
        },
        instructor: {
          select: {
            id: true,
            fullName: true,
            username: true,
            email: true
          }
        }
      }
    });

    // Log the action
    await prisma.systemLog.create({
      data: {
        action: 'SCHEDULE_CREATED',
        description: `Schedule created for ${className} - ${subjectCode} by admin ${req.user.username}`,
        userId: req.user.id,
        ipAddress: req.ip || req.connection.remoteAddress
      }
    });

    res.status(201).json({ 
      success: true, 
      data: schedule, 
      message: 'Schedule created successfully' 
    });
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({ success: false, message: 'Failed to create schedule' });
  }
});

// PUT /api/schedules/:id - Update schedule
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      laboratoryId, 
      instructorId, 
      day, 
      startTime, 
      endTime, 
      className, 
      subjectCode 
    } = req.body;

    // Check if schedule exists
    const existingSchedule = await prisma.labSchedule.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingSchedule) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }

    // Validation
    if (!laboratoryId || !instructorId || !day || !startTime || !endTime || !className || !subjectCode) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    // Validate day
    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    if (!validDays.includes(day)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid day. Must be one of: ' + validDays.join(', ') 
      });
    }

    // Validate time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid time format. Use HH:MM (24-hour format)' 
      });
    }

    // Validate end time is after start time
    if (startTime >= endTime) {
      return res.status(400).json({ 
        success: false, 
        message: 'End time must be after start time' 
      });
    }

    // Check if laboratory exists
    const laboratory = await prisma.laboratory.findUnique({
      where: { id: parseInt(laboratoryId) }
    });

    if (!laboratory) {
      return res.status(400).json({ 
        success: false, 
        message: 'Laboratory not found' 
      });
    }

    // Check if instructor exists and is an instructor
    const instructor = await prisma.user.findUnique({
      where: { id: parseInt(instructorId) }
    });

    if (!instructor || instructor.role !== 'INSTRUCTOR') {
      return res.status(400).json({ 
        success: false, 
        message: 'Instructor not found or invalid role' 
      });
    }

    // Check for schedule conflicts (excluding current schedule)
    const conflicts = await checkScheduleConflicts({
      laboratoryId: parseInt(laboratoryId),
      instructorId: parseInt(instructorId),
      day,
      startTime,
      endTime,
      excludeId: parseInt(id)
    });

    if (conflicts.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Schedule conflict detected', 
        conflicts 
      });
    }

    // Update schedule
    const schedule = await prisma.labSchedule.update({
      where: { id: parseInt(id) },
      data: {
        laboratoryId: parseInt(laboratoryId),
        instructorId: parseInt(instructorId),
        day,
        startTime,
        endTime,
        className,
        subjectCode
      },
      include: {
        laboratory: {
          select: {
            id: true,
            name: true,
            roomNumber: true,
            building: true
          }
        },
        instructor: {
          select: {
            id: true,
            fullName: true,
            username: true,
            email: true
          }
        }
      }
    });

    // Log the action
    await prisma.systemLog.create({
      data: {
        action: 'SCHEDULE_UPDATED',
        description: `Schedule updated for ${className} - ${subjectCode} by admin ${req.user.username}`,
        userId: req.user.id,
        ipAddress: req.ip || req.connection.remoteAddress
      }
    });

    res.json({ 
      success: true, 
      data: schedule, 
      message: 'Schedule updated successfully' 
    });
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({ success: false, message: 'Failed to update schedule' });
  }
});

// DELETE /api/schedules/:id - Delete schedule
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if schedule exists
    const schedule = await prisma.labSchedule.findUnique({
      where: { id: parseInt(id) },
      include: {
        laboratory: true,
        instructor: true
      }
    });

    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }

    // Delete schedule
    await prisma.labSchedule.delete({
      where: { id: parseInt(id) }
    });

    // Log the action
    await prisma.systemLog.create({
      data: {
        action: 'SCHEDULE_DELETED',
        description: `Schedule deleted for ${schedule.className} - ${schedule.subjectCode} by admin ${req.user.username}`,
        userId: req.user.id,
        ipAddress: req.ip || req.connection.remoteAddress
      }
    });

    res.json({ 
      success: true, 
      message: 'Schedule deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ success: false, message: 'Failed to delete schedule' });
  }
});

// GET /api/schedules/availability - Check availability
router.get('/availability/check', async (req, res) => {
  try {
    const { laboratoryId, instructorId, day, startTime, endTime, excludeId } = req.query;

    if (!laboratoryId || !instructorId || !day || !startTime || !endTime) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required parameters' 
      });
    }

    const conflicts = await checkScheduleConflicts({
      laboratoryId: parseInt(laboratoryId),
      instructorId: parseInt(instructorId),
      day,
      startTime,
      endTime,
      excludeId: excludeId ? parseInt(excludeId) : null
    });

    res.json({
      success: true,
      available: conflicts.length === 0,
      conflicts: conflicts
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ success: false, message: 'Failed to check availability' });
  }
});

// Helper function to check schedule conflicts
async function checkScheduleConflicts({ laboratoryId, instructorId, day, startTime, endTime, excludeId }) {
  const whereClause = {
    day,
    OR: [
      // Laboratory conflict
      {
        laboratoryId,
        OR: [
          { startTime: { lt: endTime }, endTime: { gt: startTime } }
        ]
      },
      // Instructor conflict
      {
        instructorId,
        OR: [
          { startTime: { lt: endTime }, endTime: { gt: startTime } }
        ]
      }
    ]
  };

  // Exclude current schedule if updating
  if (excludeId) {
    whereClause.id = { not: excludeId };
  }

  const conflicts = await prisma.labSchedule.findMany({
    where: whereClause,
    include: {
      laboratory: {
        select: {
          id: true,
          name: true,
          roomNumber: true
        }
      },
      instructor: {
        select: {
          id: true,
          fullName: true
        }
      }
    }
  });

  return conflicts;
}

// Helper function to get semester start month
function getSemesterStartMonth(semester) {
  const semesterMap = {
    'First': 'August',
    'Second': 'January',
    'Summer': 'June'
  };
  return semesterMap[semester] || 'August';
}

// Helper function to get semester end month
function getSemesterEndMonth(semester) {
  const semesterMap = {
    'First': 'December',
    'Second': 'May',
    'Summer': 'July'
  };
  return semesterMap[semester] || 'December';
}

export default router;
