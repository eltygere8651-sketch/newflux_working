const fs = require('fs');
let code = fs.readFileSync('src/components/VIPLandingView.tsx', 'utf8');

const regex = /      await setDoc\(doc\(db, "users", uid\), \{[\s\S]*?originCampaign: campaignId \|\| null,[\s\S]*?\}, \{ merge: true \}\);/;

const replacement = `      await setDoc(doc(db, "users", uid), {
        displayName: randomName,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        lastActiveAt: now,
        totalUsageTime: 0,
        originCampaign: campaignId || null,
      }, { merge: true });

      const token = await auth.currentUser?.getIdToken(true);
      if (!token) throw new Error("No token");

      const res = await fetch("/api/trial/activate-vip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": \`Bearer \${token}\`
        },
        body: JSON.stringify({
          deviceHash: hash,
          campaignId: campaignId || null,
          displayName: randomName
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to activate VIP trial");
      }`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/components/VIPLandingView.tsx', code);
