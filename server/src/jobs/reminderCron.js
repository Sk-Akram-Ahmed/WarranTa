const cron = require('node-cron');
const Warranty = require('../models/Warranty');
const { sendEmail } = require('../config/mailer');

const initReminderCron = () => {
  cron.schedule('0 9 * * *', async () => {
    console.log('[Cron Job] Running daily 09:00 AM warranty reminder check...');
    try {
      const now = new Date();

      const warranties = await Warranty.find({
        expiryDate: { $gt: now },
        $or: [{ reminder30Sent: false }, { reminder7Sent: false }, { reminder1Sent: false }],
      }).populate('userId', 'email name');

      for (const item of warranties) {
        if (!item.userId || !item.userId.email) continue;

        const diffMs = item.expiryDate.getTime() - now.getTime();
        const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        let shouldSend = false;
        let milestone = 0;
        let updateField = '';

        if (daysRemaining <= 1 && !item.reminder1Sent) {
          shouldSend = true;
          milestone = 1;
          updateField = 'reminder1Sent';
        } else if (daysRemaining <= 7 && !item.reminder7Sent) {
          shouldSend = true;
          milestone = 7;
          updateField = 'reminder7Sent';
        } else if (daysRemaining <= 30 && !item.reminder30Sent) {
          shouldSend = true;
          milestone = 30;
          updateField = 'reminder30Sent';
        }

        if (shouldSend) {
          const subject = `[Warranty Alert] ${item.productName} warranty expires in ${milestone} day(s)`;
          const text = `Hello ${item.userId.name},\n\nThis is an automated reminder that your warranty for "${item.productName}" (${item.brand || 'No Brand'}) is expiring on ${item.expiryDate.toDateString()} (in approximately ${daysRemaining} day(s)).\n\nPlease check your saved documents if you need to submit a claim.\n\nBest regards,\nWarranty Tracker Team`;

          const html = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
              <h2 style="color: #dc2626; margin-top: 0;">Warranty Expiry Notice</h2>
              <p>Hello <strong>${item.userId.name}</strong>,</p>
              <p>Your warranty for <strong>${item.productName}</strong> ${item.brand ? `(${item.brand})` : ''} is expiring soon.</p>
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr style="background: #f8fafc;">
                  <td style="padding: 10px; border: 1px solid #cbd5e1;"><strong>Expiry Date:</strong></td>
                  <td style="padding: 10px; border: 1px solid #cbd5e1;">${item.expiryDate.toDateString()}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid #cbd5e1;"><strong>Days Remaining:</strong></td>
                  <td style="padding: 10px; border: 1px solid #cbd5e1;"><strong>${daysRemaining} day(s)</strong></td>
                </tr>
                ${item.serialNumber ? `<tr style="background: #f8fafc;"><td style="padding: 10px; border: 1px solid #cbd5e1;"><strong>Serial Number:</strong></td><td style="padding: 10px; border: 1px solid #cbd5e1;">${item.serialNumber}</td></tr>` : ''}
              </table>
              <p>Visit your dashboard to view uploaded bills or guarantee certificates.</p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
              <small style="color: #64748b;">This email was automatically sent by Warranty Tracker.</small>
            </div>
          `;

          await sendEmail({
            to: item.userId.email,
            subject,
            text,
            html,
          });

          item[updateField] = true;
          await item.save();
          console.log(`[Cron Job] Sent ${milestone}-day alert for warranty ${item._id} to ${item.userId.email}`);
        }
      }
    } catch (err) {
      console.error('[Cron Job Error] Failed executing warranty reminders:', err.message);
    }
  });
};

module.exports = initReminderCron;
