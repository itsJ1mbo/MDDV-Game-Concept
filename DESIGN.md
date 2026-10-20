# 1. DESCRIPTION 
This game is a 2D side-scrolling platformer about a lost teddy bear struggling to find its way back home through a shadowy, hostile world. Confined within an oppressive fog of war that severely restricts vision, the player must navigate treacherous environments while relying on subtle cues and a pair of dual lanterns to detect and survive unseen dangers. 

Unlike traditional platformers that emphasize speed and clear environmental visibility, this game turns light into both a vital radar and a dangerously volatile weapon. Survival relies on high-tension resource management: using your lights to destroy incoming enemies generates intense heat, and overusing them will permanently explode your lanterns, leaving you completely defenseless in total darkness. 

# 2. SETTING 
The narrative centers on a small, worn teddy bear embarking on an emotional journey across a world distorted by childish fears and solitude. Told entirely through atmospheric environmental storytelling, the journey transitions from dark domestic spaces to surreal, oversized landscapes where everyday objects become ominous obstacles. Visually, the game pairs a melancholic, painterly aesthetic with dramatic contrast and dynamic lighting shadows. A minimalist, atmospheric soundscape heightens the claustrophobic mood, making every footstep and soft hum of the lanterns feel intimately grounded in a world of unsettling isolation. 

# 3. MAIN GAME MECHANICS 

## Movement
The player can move in any direction (for a 2D game) and jump. The movement has to feel grounded and cautious.

## Life
The player has 3 points of life. On enemy touch it loses one and gets staggered. If the player falls to an abism or loses every lifepoint it dies. When dead it reappearse in the nearest checkpoint

## Tight Fog of War 
A dense perimeter of fog restricts the player's visibility to a very short radius, creating a constant feeling of being lost and forcing reliance on cautious movement and audio cues. A very tight, small circle of light surrounds the player character. Everything outside this immediate circle is pitch black / covered in dense fog.

## Directional Threat Sensing 
Dual lanterns equipped on the character automatically light up and swivel toward approaching enemies, acting as an early warning radar before threats become visible. Mechanic details:

- When no enemies are nearby, lanterns point in a default idle position with low intensity.
-  When an enemy enters detection range (even inside the fog), the lanterns rotate/swivel toward the nearest threat and glow brighter as the enemy gets closer.

This passive threat-sensing lanterns do **NOT** clear or illuminate the fog of war.

## Directional Light Combat 
Shining a lantern beam directly at an enemy burns and destroys them, requiring precise and calm timing under pressure. The player’s active directional flashlight beam must clear/carve out the fog in real-time in the exact shape of the acute light cone, very much like a lighthouse. 

This is not an extra light beam, this means that the player has two buttons (one for each light beam) that lights up its respevtive beam making a flashlight that the player do not have to aim (it aims automatically to the nearest enemy). If the beam does not sense any enemy it can not be lit up.

Enemies caught inside the beam get froze and disintegrate after continuous exposure. If the light source stops the enemy regains its missing health instantly, this means: or the enemy gets destroyed or you have to start again.

## Overheating & Light Explosion 
Sustained light output causes the lanterns to overheat rapidly; if held for too long continuously, the light source permanently explodes, stripping the player of vision and combat capability. 

- Holding the flashlight button increases heat on its lantern
- Releasing the button cools down the lantern (slower than heating it up)
- If heat reaches its maximum the lantern explodes.

## Checkpoints and resting
Locations in the map where the player can rest, very much like Dark Souls' bonfires or Hollow Knights' benches. Resting regenerates every lifepoint and if any lantern is destroyed it reappears.

# 4. ENEMIES
- Basic enemy:
    - **Behavior:** Simple shadow entities that spawn outside the fog of war and slowly stalk/creep toward the player.
    - **Vulnerability:** Unaffected by the passive radar glow, but destroyed when illuminated by the active light cone for a set threshold.

# 5. REFERENCES 
- Inside: For its masterclass in silent environmental storytelling, oppressive atmosphere, and minimalist platforming tension. 
- Little Nightmares: For the visual aesthetic of a tiny, vulnerable protagonist exploring an oversized, intimidating world. 
- Alan Wake: For the core mechanic of utilizing focused light as a primary weapon to destroy lurking enemies.
- Lost Ollie: For the narrative of a lost plushie and his owner that want to reunite.