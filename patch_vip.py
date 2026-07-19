import re

with open('src/components/VIPLandingView.tsx', 'r') as f:
    content = f.read()

# Replace the block
old_block = """      if (hashDoc.exists()) {
        const data = hashDoc.data();
        activatedAt = data.activatedAt || Date.now();
        const isExpired = Date.now() > activatedAt + (7 * 24 * 60 * 60 * 1000);
        
        if (isExpired) {
          setTrialState('expired');
          setIsLoading(false);
          return;
        }
      } else {
        await setDoc(hashRef, { 
          activatedAt: activatedAt,
        });
      }

      let uid = auth.currentUser?.uid;
      if (!uid) {
        const userCred = await recoverOrSignInGuest();
        uid = userCred.user.uid;
      }"""

new_block = """      if (hashDoc.exists()) {
        const data = hashDoc.data();
        activatedAt = data.activatedAt || Date.now();
        const isExpired = Date.now() > activatedAt + (7 * 24 * 60 * 60 * 1000);
        
        if (isExpired) {
          setTrialState('expired');
          setIsLoading(false);
          return;
        }
      }

      let uid = auth.currentUser?.uid;
      if (!uid) {
        const userCred = await recoverOrSignInGuest();
        uid = userCred.user.uid;
      }

      if (!hashDoc.exists()) {
        await setDoc(hashRef, { 
          activatedAt: activatedAt,
          uid: uid
        });
      }"""

if old_block in content:
    content = content.replace(old_block, new_block)
    with open('src/components/VIPLandingView.tsx', 'w') as f:
        f.write(content)
    print("Patched successfully.")
else:
    print("Old block not found!")
