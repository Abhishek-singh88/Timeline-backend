const express = require('express');
const { body, validationResult } = require('express-validator');
const supabase = require('../config/supabase');
const { sendWelcomeEmail } = require('../services/emailService');

const router = express.Router();

// Email validation middleware
const validateEmail = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
    .isLength({ min: 5, max: 254 })
    .withMessage('Email must be between 5 and 254 characters')
];

// Signup endpoint
router.post('/', validateEmail, async (req, res) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid email format',
        details: errors.array()
      });
    }

    const { email } = req.body;
    console.log(`📧 New signup attempt: ${email}`);

    // Check if email already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('email_subscribers')
      .select('email, is_active')
      .eq('email', email)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingUser) {
      if (existingUser.is_active) {
        return res.status(409).json({ 
          success: false,
          error: 'Email already subscribed to updates'
        });
      } else {
        // Reactivate subscription
        const { error: updateError } = await supabase
          .from('email_subscribers')
          .update({ is_active: true })
          .eq('email', email);

        if (updateError) throw updateError;

        await sendWelcomeEmail(email);
        console.log(`✅ Reactivated subscription: ${email}`);
        
        return res.status(200).json({ 
          success: true,
          message: 'Welcome back! Your subscription has been reactivated.'
        });
      }
    }

    // Insert new subscriber
    const { data, error } = await supabase
      .from('email_subscribers')
      .insert([{ email }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ 
          success: false,
          error: 'Email already subscribed' 
        });
      }
      throw error;
    }

    // Send welcome email
    try {
      await sendWelcomeEmail(email);
      console.log(`📨 Welcome email sent to: ${email}`);
    } catch (emailError) {
      console.error('⚠️ Failed to send welcome email:', emailError);
      // Don't fail the signup if email fails
    }

    console.log(`✅ New subscriber added: ${email}`);
    res.status(201).json({ 
      success: true,
      message: 'Successfully subscribed! Check your email for confirmation.',
      subscriber: {
        id: data.id,
        email: data.email,
        subscribed_at: data.subscribed_at
      }
    });

  } catch (error) {
    console.error('❌ Signup error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to subscribe. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get subscriber count (optional endpoint)
router.get('/count', async (req, res) => {
  try {
    const { count, error } = await supabase
      .from('email_subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (error) throw error;

    res.json({ 
      success: true,
      active_subscribers: count 
    });
  } catch (error) {
    console.error('❌ Error getting subscriber count:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get subscriber count' 
    });
  }
});

module.exports = router;
