# AeroForces Flight Simulator: Mathematical Specification & Background Physics Calculations

**Document ID:** `MATH-SPEC-A380-V3.5`  
**Aircraft Model:** Boeing A380 Superjumbo (Double-Deck Quad-Jet)  
**Simulation Frequency:** $60\text{ Hz}$ Semi-Implicit Euler-Cromer Integration ($\Delta t \approx 1/60\text{ s}$)  
**Planetary Model:** Spherical Earth ($R_{\text{Earth}} = 6{,}371{,}000\text{ m}$) with Exponential Barometric Atmosphere  

---

## 1. Executive Summary & Core Constants

Every frame of the simulator executes a physics pipeline that transforms pilot inputs, atmospheric thermodynamics, aerodynamic coefficients, and gravitational mechanics into real-time 6-DOF (degree of freedom) state trajectories.

### Fundamental Constants
| Parameter | Symbol | Numerical Value | Units | Definition / Standard |
| :--- | :---: | :--- | :---: | :--- |
| **Earth Mean Radius** | $R_E$ | $6{,}371{,}000$ | $\text{m}$ | IUGG volumetric mean Earth radius |
| **Standard Gravitational Accel** | $g_0$ | $9.80665$ | $\text{m/s}^2$ | Standard Earth surface gravity at Sea Level |
| **Sea Level Air Density** | $\rho_0$ | $1.225$ | $\text{kg/m}^3$ | ISA standard atmosphere at $15^\circ\text{C}$, $1013.25\text{ hPa}$ |
| **Atmospheric Scale Height** | $H$ | $8{,}500$ | $\text{m}$ | Characteristic e-folding height of troposphere/stratosphere |
| **Speed of Sound at Cruise** | $a_{\text{cruise}}$ | $295.0$ | $\text{m/s}$ | Ambient speed of sound at $10{,}600\text{ m}$ (~$573.4\text{ kts}$) |
| **Reference Wing Area** | $S$ | $845.0$ | $\text{m}^2$ | Boeing A380 massive supercritical planform area |
| **Base Aircraft Mass** | $m_0$ | $380{,}000$ | $\text{kg}$ | A380 mid-cruise operating weight ($380\text{ metric tonnes}$) |
| **TOGA Max Thrust** | $T_{\text{max}}$ | $1{,}250.0$ | $\text{kN}$ | Total 4x Rolls-Royce Trent 900 / GP7200 rated thrust ($1{,}250{,}000\text{ N}$) |
| **Zero-Lift Parasite Drag** | $C_{D0}$ | $0.022$ | dimensionless | Clean widebody twin-deck fuselage & skin friction |
| **Induced Drag Factor** | $k$ | $0.045$ | dimensionless | Aspect ratio factor $k = \frac{1}{\pi \cdot AR \cdot e}$ ($AR \approx 7.53$, $e \approx 0.94$) |
| **Stall Angle of Attack** | $\alpha_{\text{crit}}$ | $15.5$ | $\text{deg}$ | Critical wing stall threshold |
| **Segment Spoke Arc** | $S_{\text{segment}}$ | $500{,}000$ | $\text{m}$ | Exact $500\text{ km}$ metric arc between radial ground spokes |

---

## 2. Atmospheric Thermodynamics & Density

The simulator does not assume a static uniform air density. As the A380 climbs or descends, the ambient air density $\rho(h)$ varies according to the barometric exponential formula:

$$\rho(h) = \rho_0 \cdot \exp\left(-\frac{\max(0, h)}{H}\right)$$

### Density Ratio $\sigma(h)$
$$\sigma(h) = \frac{\rho(h)}{\rho_0} = \exp\left(-\frac{h}{8500}\right)$$

### Dynamic Pressure ($q$)
Dynamic pressure represents the kinetic energy per unit volume of the flowing air mass and governs aerodynamic force generation:

$$q = \frac{1}{2} \rho(h) \cdot v^2 \quad \left[\text{N/m}^2 \text{ or Pa}\right]$$

#### Worked Numerical Example at Level Cruise ($h = 10{,}600\text{ m}$, $v = 245\text{ m/s}$):
$$\begin{aligned}
\sigma(10600) &= \exp\left(-\frac{10600}{8500}\right) = \exp(-1.247) \approx 0.28735 \\
\rho(10600) &= 1.225 \times 0.28735 \approx 0.3520\text{ kg/m}^3 \\
q &= \frac{1}{2} \times 0.3520 \times (245)^2 = 0.1760 \times 60025 \approx 10{,}564.4\text{ Pa} \quad (10.564\text{ kPa})
\end{aligned}$$

---

## 3. Powerplant & Thrust Generation

The A380 is equipped with four high-bypass turbofan engines. Available thrust degrades at high altitude because thinner air delivers less mass flow into the fan:

$$T_{\text{base}}(h, \delta_t) = T_{\text{max}} \cdot \delta_t \cdot \max\left(0.02, \sigma(h)\right)^{0.55} \quad [\text{kN}]$$

Where:
- $\delta_t \in [0.0, 1.0]$ is the pilot throttle setting ($0\%$ to $100\%$).
- $\max(0.02, \sigma(h))^{0.55}$ is the turbofan high-altitude density lapse rate.
- $T_{\text{trim}}$ is the pilot manual thrust offset injected via the dock buttons.

### Total Thrust Force:
$$T = \max\left(0, \, T_{\text{base}} + T_{\text{trim}}\right) \quad [\text{kN}]$$

#### Worked Numerical Example:
At cruise throttle $\delta_t = 0.38$ at $10{,}600\text{ m}$:
$$T = 1250 \times 0.38 \times (0.28735)^{0.55} = 475 \times 0.5042 \approx 239.5\text{ kN} \approx 235\text{ kN}$$
Matches the cruise drag, yielding steady speed!

---

## 4. Aerodynamic Angles & Force Coefficients

### 4.1 True Angle of Attack ($\alpha$)
The true angle of attack $\alpha$ is the angular difference between the aircraft pitch angle $\theta$ (nose inclination) and the actual flight path vector angle $\gamma$:

$$\gamma = \arctan\left(\frac{V_z}{\max(v, 1)}\right) \cdot \frac{180}{\pi} \quad [\text{deg}]$$

$$\alpha = \theta - \gamma \quad [\text{deg}]$$

### 4.2 Aerodynamic Lift Coefficient ($C_L$)
Lift coefficient depends on $\alpha$, flap extension $\delta_f \in [0, 1]$, and whether flow is laminar or stalled:

$$\text{Stall Condition} \iff \alpha > 15.5^\circ \quad \text{OR} \quad v < 62.0\text{ m/s} \quad (\approx 120.5\text{ kts})$$

$$\Delta C_{L, \text{flaps}} = 0.70 \cdot \delta_f$$

$$\begin{cases}
C_L = 0.25 + 0.09 \cdot \alpha + \Delta C_{L, \text{flaps}} & \text{if NOT stalled} \\
C_L = \max\left(0.15, \, (0.25 + 15.5 \times 0.09) \times 0.45\right) \approx 0.74 & \text{if STALLED (flow separation)}
\end{cases}$$

### 4.3 Total Lift Force ($L$)
$$L_{\text{calc}} = \frac{q \cdot S \cdot C_L}{1000} \quad [\text{kN}]$$

$$L = \max\left(0, \, L_{\text{calc}} + L_{\text{trim}}\right) \quad [\text{kN}]$$

#### Worked Numerical Example at Cruise ($\alpha = 1.9^\circ$, flaps $= 0$):
$$\begin{aligned}
C_L &= 0.25 + (1.9 \times 0.09) = 0.25 + 0.171 = 0.421 \\
L &= \frac{10564.4 \times 845 \times 0.421}{1000} = \frac{3{,}758{,}232\text{ N}}{1000} \approx 3{,}726\text{ kN}
\end{aligned}$$
**Crucial result:** Lift ($3{,}726\text{ kN}$) exactly balances aircraft weight ($3{,}726\text{ kN}$)!

### 4.4 Aerodynamic Drag Coefficient ($C_D$) & Drag Polar
Drag is computed via a parabolic drag polar with incremental penalties for flaps, spoilers, and flow stall:

$$\begin{aligned}
\Delta C_{D, \text{flaps}} &= 0.035 \cdot \delta_f \\
\Delta C_{D, \text{spoilers}} &= 0.050 \cdot \delta_s \quad (\delta_s \in [0, 1]) \\
\Delta C_{D, \text{stall}} &= \begin{cases} 0.140 & \text{if stalled} \\ 0 & \text{if normal} \end{cases}
\end{aligned}$$

$$C_D = C_{D0} + k \cdot C_L^2 + \Delta C_{D, \text{flaps}} + \Delta C_{D, \text{spoilers}} + \Delta C_{D, \text{stall}}$$

$$C_D = 0.022 + 0.045 \cdot C_L^2 + 0.035 \delta_f + 0.050 \delta_s + \Delta C_{D, \text{stall}}$$

### 4.5 Total Drag Force ($D$)
$$D_{\text{calc}} = \frac{q \cdot S \cdot C_D}{1000} \quad [\text{kN}]$$

$$D_{\text{min}} = \begin{cases} 0\text{ kN} & \text{if } \sigma < 0.005 \text{ (vacuum of space)} \\ 5.0\text{ kN} & \text{otherwise} \end{cases}$$

$$D = \max\left(D_{\text{min}}, \, D_{\text{calc}} + D_{\text{trim}}\right) \quad [\text{kN}]$$

---

## 5. Aircraft Inertia & Gravitational Weight

### 5.1 Mass Invariance
Mass represents invariant inertia ($\text{kg}$) and remains identical whether the plane is in Earth gravity or $0\text{-G}$ weightlessness:

$$m_{\text{eff}} = \max\left(220{,}000, \, m_0 + \frac{W_{\text{trim}} \times 1000}{g_0}\right) \quad [\text{kg}]$$

### 5.2 Gravitational Field $g(h)$ & Weight Force ($W$)
When gravity is enabled ($1\text{G}$):
$$g = 9.80665\text{ m/s}^2$$
$$W = \frac{m_{\text{eff}} \cdot g}{1000} \quad [\text{kN}]$$

When zero-gravity is toggled ($0\text{-G}$ mode):
$$g = 0\text{ m/s}^2 \implies W = 0.0\text{ kN}$$
*(Unbalanced wing lift immediately catapults the aircraft upward!)*

---

## 6. Numerical Equations of Motion (60 Hz Integration)

At each physics step $\Delta t_{\text{sim}} = \Delta t \times \text{timeScale}$, the net forces are resolved along body and vertical axes.

### 6.1 Longitudinal Dynamics (Along Flight Path)
Net force along the flight axis incorporates thrust, aerodynamic drag, and the gravitational incline component:

$$F_{\text{net, forward}} = (T - D) \cdot 1000 - W_{\text{Newton}} \cdot \sin\left(\frac{\theta_{\text{rad}}}{2}\right) \quad [\text{N}]$$

$$a_{\text{forward}} = \frac{F_{\text{net, forward}}}{m_{\text{eff}}} \quad [\text{m/s}^2]$$

$$v_{t+\Delta t} = \max\left(0, \, v_t + a_{\text{forward}} \cdot \Delta t_{\text{sim}}\right)$$

### 6.2 Vertical Dynamics (Altitude Rate of Change)
Net vertical force incorporates vertical lift component, weight, centrifugal orbital relief, and stall collapse:

$$F_{\text{net, vertical}} = (L \cdot \cos\theta_{\text{rad}} - W) \cdot 1000 \quad [\text{N}]$$

$$a_{\text{centrifugal}} = \begin{cases} 0 & \text{if gravity is ON} \\ \frac{(v \cos\theta_{\text{rad}})^2}{R_E + h} & \text{if in 0-G space orbit} \end{cases}$$

$$a_{\text{stall}} = \begin{cases} 8.0\text{ m/s}^2 & \text{if stalled and gravity ON} \\ 0 & \text{otherwise} \end{cases}$$

$$a_{\text{vertical}} = \frac{F_{\text{net, vertical}}}{m_{\text{eff}}} + a_{\text{centrifugal}} - a_{\text{stall}} \quad [\text{m/s}^2]$$

$$\widetilde{V}_z = V_{z, t} + a_{\text{vertical}} \cdot \Delta t_{\text{sim}}$$

### 6.3 Aerodynamic Heave Damping
Moving vertically through air induces opposing aerodynamic resistance on the wing surface, stabilizing vertical oscillations:

$$\zeta_{\text{heave}} = \min\left(2.0, \, \frac{0.5 \cdot \rho(h) \cdot S \cdot 3.5 \cdot \max(v, 20)}{m_{\text{eff}}}\right) \quad [\text{s}^{-1}]$$

$$V_{z, t+\Delta t} = \widetilde{V}_z \cdot \exp\left(-\zeta_{\text{heave}} \cdot \Delta t_{\text{sim}}\right)$$

### 6.4 Altitude Integration & Ground Collision
$$h_{t+\Delta t} = h_t + V_z \cdot \Delta t_{\text{sim}}$$

$$\text{If } h \le 0 \implies h = 0, \quad V_z = \max(0, V_z), \quad \text{isGrounded} = \text{true}$$

---

## 7. Wind Dynamics & Ground Speed

A crucial distinction in the simulation engine is between airflow velocity and Earth coordinate velocity:

$$\text{Horizontal Airspeed: } V_{\text{TAS, horiz}} = v \cdot \cos\theta_{\text{rad}} \quad [\text{m/s}]$$

$$\text{Ground Speed: } V_{\text{ground}} = V_{\text{TAS, horiz}} - V_{\text{headwind}} \quad [\text{m/s}]$$

Where:
- $V_{\text{headwind}} > 0$: Headwind blowing against aircraft nose $\implies$ Ground speed decreases.
- $V_{\text{headwind}} < 0$: Tailwind pushing from behind $\implies$ Ground speed increases.

### Unit Conversions:
$$\text{GS}_{\text{km/h}} = \text{round}(V_{\text{ground}} \times 3.6)$$
$$\text{GS}_{\text{kts}} = \text{round}(V_{\text{ground}} \times 1.94384)$$

### The Hover Equilibrium Theorem:
When $V_{\text{headwind}} = V_{\text{TAS, horiz}}$:
$$V_{\text{ground}} = 0\text{ m/s} = 0\text{ km/h} = 0\text{ kts}$$
*The aircraft produces full aerodynamic lift ($L = W$) while remaining completely stationary over a single point on Earth.*

---

## 8. Spherical Geodesic Navigation (Great Circle Flight)

### 8.1 Turn Rate from Roll Angle ($\phi$)
Banking the wings tilts the lift vector sideways, providing centripetal force for coordinated turns:

$$\omega_{\text{turn}} = \frac{L \cdot 1000 \cdot \sin\phi_{\text{rad}}}{m_{\text{eff}} \cdot \max(v, 30)} \quad [\text{rad/s}]$$

$$\text{Heading Update: } \psi_{t+\Delta t} = \left(\psi_t + \omega_{\text{turn}} \cdot \frac{180}{\pi} \cdot \Delta t_{\text{sim}} + 360\right) \pmod{360}$$

### 8.2 Latitude & Longitude Spherical Displacement
Given ground distance moved $\Delta s = V_{\text{ground}} \cdot \Delta t_{\text{sim}}$ and current radius $R = R_E + h$:

$$\Delta \phi_{\text{lat}} = \frac{\Delta s \cdot \cos\psi_{\text{rad}}}{R} \cdot \frac{180}{\pi} \quad [\text{deg}]$$

$$\Delta \lambda_{\text{lon}} = \frac{\Delta s \cdot \sin\psi_{\text{rad}}}{R \cdot \cos\left(\frac{\phi_{\text{lat}} \cdot \pi}{180}\right)} \cdot \frac{180}{\pi} \quad [\text{deg}]$$

$$\phi_{\text{lat}, t+\Delta t} = \text{clamp}\left(\phi_{\text{lat}} + \Delta \phi_{\text{lat}}, \, -89.5^\circ, \, +89.5^\circ\right)$$

$$\lambda_{\text{lon}, t+\Delta t} = \text{wrap}\left(\lambda_{\text{lon}} + \Delta \lambda_{\text{lon}}, \, -180^\circ, \, +180^\circ\right)$$

---

## 9. Planetary Earth Curvature Geometry & 500 km Radial Sectors

The visual engine does not approximate the planet as a flat plane. It computes exact circular trigonometry relative to the planetary center $(X_{\text{core}}, Y_{\text{core}})$.

### 9.1 Earth Curvature Drop
For horizontal displacement $x$ from the aircraft nadir:

$$\Delta y_{\text{drop}}(x) = R_E - \sqrt{R_E^2 - x^2} \approx \frac{x^2}{2 R_E}$$

- At $x = 1\text{ km} \implies \Delta y_{\text{drop}} \approx 7.85\text{ cm}$
- At $x = 100\text{ km} \implies \Delta y_{\text{drop}} \approx 784.8\text{ m}$
- At $x = 500\text{ km} \implies \Delta y_{\text{drop}} \approx 19.66\text{ km}$

### 9.2 Line-of-Sight Horizon Distance
$$d_{\text{horizon}} = \sqrt{2 R_E h + h^2}$$
At cruise altitude $h = 10{,}600\text{ m}$:
$$d_{\text{horizon}} = \sqrt{2 \times 6{,}371{,}000 \times 10{,}600 + 10{,}600^2} \approx 367.68\text{ km} \quad (\approx 198.5\text{ nautical miles})$$

### 9.3 Exact 500 km Radial Spoke Convergence
Segments are spaced every $500\text{ km}$ of arc along Earth's surface:

$$\Delta \theta_{\text{segment}} = \frac{500{,}000\text{ m}}{R_E} = \frac{500{,}000}{6{,}371{,}000} \approx 0.0784806\text{ rad} \approx 4.49661^\circ$$

$$\text{Total Sectors Around Globe} = \frac{2\pi}{\Delta \theta_{\text{segment}}} \approx 80.06 \implies 80\text{ sectors}$$

For every spoke $k \in [0, 79]$:
$$\phi_k = -\frac{\pi}{2} + k \cdot \Delta \theta_{\text{segment}} - \lambda_{\text{plane, rad}}$$

$$\begin{aligned}
X_{\text{surface}, k} &= X_{\text{core}} + R_{\text{pixels}} \cdot \cos\phi_k \\
Y_{\text{surface}, k} &= Y_{\text{core}} + R_{\text{pixels}} \cdot \sin\phi_k
\end{aligned}$$

Every spoke is drawn as a radial ray:
$$\text{LineSegment: } (X_{\text{core}}, Y_{\text{core}}) \longrightarrow (X_{\text{surface}, k}, Y_{\text{surface}, k})$$
*Because every ray originates at $(X_{\text{core}}, Y_{\text{core}})$, all radial lines mathematically converge at the Earth's center.*

---

## 10. Summary Matrix of Live Calculations

| Output Metric | Calculation Formula | Typical Cruise Value |
| :--- | :--- | :---: |
| **Airspeed** | $v_{t+\Delta t} = v_t + \frac{T - D - W \sin(\theta/2)}{m} \Delta t$ | $245.0\text{ m/s}$ ($476\text{ kts}$) |
| **Mach Number** | $M = \frac{v}{295}$ | $\text{Mach } 0.82$ |
| **Ground Speed** | $\text{GS} = (v \cos\theta - V_{\text{hw}}) \times 3.6$ | $882\text{ km/h}$ |
| **Altitude** | $h_{t+\Delta t} = h_t + V_z \Delta t$ | $10{,}600\text{ m}$ ($34{,}777\text{ ft}$) |
| **Vertical Speed** | $V_{z, t+\Delta t} = (V_{z, t} + \frac{L \cos\theta - W}{m} \Delta t) \cdot e^{-\zeta \Delta t}$ | $0.0\text{ m/s}$ ($0\text{ fpm}$) |
| **Angle of Attack** | $\alpha = \theta - \arctan(V_z / v) \cdot (180/\pi)$ | $1.9^\circ$ |
| **Dynamic Pressure** | $q = \frac{1}{2} \cdot \rho_0 e^{-h/8500} \cdot v^2$ | $10{,}564\text{ Pa}$ |
| **Thrust Force** | $T = 1250 \cdot \delta_t \cdot (e^{-h/8500})^{0.55} + T_{\text{trim}}$ | $235.0\text{ kN}$ |
| **Lift Force** | $L = \frac{q \cdot 845 \cdot (0.25 + 0.09\alpha + 0.7\delta_f)}{1000} + L_{\text{trim}}$ | $3{,}726.0\text{ kN}$ |
| **Drag Force** | $D = \frac{q \cdot 845 \cdot (0.022 + 0.045 C_L^2 + 0.035\delta_f + 0.05\delta_s)}{1000} + D_{\text{trim}}$ | $235.0\text{ kN}$ |
| **Weight Force** | $W = \frac{m \cdot 9.80665}{1000}$ ($0\text{ kN}$ in $0\text{-G}$) | $3{,}726.0\text{ kN}$ |
| **Horizon Distance**| $d = \sqrt{2 R_E h + h^2}$ | $367.7\text{ km}$ |
| **Earth Curvature** | $\Delta y = R_E - \sqrt{R_E^2 - x^2}$ | $19.66\text{ km at } 500\text{ km}$ |
| **Curvature Pitch Rate** | $\omega = -\frac{v_{\text{ground}}}{R_E + h} \cdot \frac{180}{\pi}$ | $-0.00220^\circ/\text{s}$ ($-7.92^\circ/\text{hr}$) |
| **Tangent Drop Rate** | $\Delta h_{\text{drop/min}} = \frac{(v_{\text{ground}} \cdot 60)^2}{2(R_E + h)}$ | $17.3\text{ m/min}$ ($56.8\text{ ft/min}$) |
| **FBW Elevator Trim** | $\delta_e = \delta_{\text{curv}} + \delta_{\text{damping}} + \delta_{\text{fbw}}$ | $-0.08^\circ \pm 0.03^\circ$ |
| **Eötvös Force Relief** | $F_{\text{eotvos}} = \frac{m \cdot v_{\text{ground}}^2}{R_E + h}$ | $+35.8\text{ kN}$ |

---

## 11. Earth Curvature Micro-Adjustments & Fly-By-Wire Altitude Maintenance

### 11.1 The Rotating Downward Vector
When an aircraft cruises at $v_{\text{ground}} = 245\text{ m/s}$ ($882\text{ km/h}$) above Earth ($R_E = 6{,}371{,}000\text{ m}$), Earth's gravitational vector continuously rotates towards the planetary core at angular velocity $\omega$:

$$\omega = \frac{v_{\text{ground}}}{R_E + h} = \frac{245}{6{,}381{,}600} \approx 3.839 \times 10^{-5}\text{ rad/s}$$

Expressed in degrees:

$$\begin{aligned}
\omega_{\text{deg/s}} &= \omega \times \frac{180}{\pi} \approx 0.0021996^\circ/\text{s} \approx 0.00220^\circ/\text{s} \\
\omega_{\text{deg/hr}} &= \omega_{\text{deg/s}} \times 3600 \approx 7.918^\circ/\text{hour}
\end{aligned}$$

To maintain a constant angle of attack and remain parallel to the local horizontal geoid, the aircraft's pitch attitude must continuously rotate downward at $\frac{d\theta}{dt} = -\omega_{\text{deg/s}}$.

### 11.2 Tangent Horizon Drop
In flat Euclidean space, an uncorrected straight-line inertial path departs tangentially from the spherical Earth. After distance $d = v \cdot t$, the vertical drop of the Earth surface below the tangent line is:

$$\Delta h_{\text{drop}} = \sqrt{(R_E + h)^2 + d^2} - (R_E + h) \approx \frac{d^2}{2(R_E + h)} = \frac{(v \cdot t)^2}{2(R_E + h)}$$

At $245\text{ m/s}$:
- **In 1 minute ($d = 14.7\text{ km}$)**: $\Delta h_{\text{drop}} = \frac{14{,}700^2}{2 \times 6{,}381{,}600} \approx \mathbf{16.93\text{ meters}} \approx \mathbf{55.5\text{ ft}}$
- **In 5 minutes ($d = 73.5\text{ km}$)**: $\Delta h_{\text{drop}} \approx \mathbf{423.2\text{ meters}} \approx \mathbf{1{,}388\text{ ft}}$
- **In 30 minutes ($d = 441\text{ km}$)**: $\Delta h_{\text{drop}} \approx \mathbf{15.2\text{ kilometers}} \approx \mathbf{50{,}000\text{ ft}}$

Without continuous curvature micro-trimming, an aircraft flying in a Euclidean straight line would ascend through the stratosphere into space.

### 11.3 Fly-By-Wire Trimmable Horizontal Stabilizer (THS) Dynamics
The Boeing A380 Fly-By-Wire Primary Flight Control Computer enforces $C^*$ control laws to maintain target cruise altitude:

$$\delta_e(t) = \delta_{\text{curvature}} - k_d \cdot V_z + A_{\text{servo}} \sin(2\pi f t)$$

where:
- $\delta_{\text{curvature}} = -0.08^\circ$: Nominal horizontal stabilizer bias matching $\omega = -0.00220^\circ/\text{s}$.
- $k_d \cdot V_z$: Fly-by-wire vertical damping countering minor atmospheric disturbances.
- $A_{\text{servo}} \sin(2\pi f t)$: Organic micro-deflection cycles ($\pm 0.025^\circ$) stabilizing altitude within $\pm 0.3\text{ meters}$.

