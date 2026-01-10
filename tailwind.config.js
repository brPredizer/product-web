/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
	content: [
		"./src/app/**/*.{js,jsx,ts,tsx}",
		"./src/components/**/*.{js,jsx,ts,tsx}",
		"./src/views/**/*.{js,jsx,ts,tsx}",
		"./src/lib/**/*.{js,jsx,ts,tsx}"
	],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
			colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
			},
			// Status and category colors mapped to CSS variables for charts
			status: {
				pending: 'var(--color-pending)',
				approved: 'var(--color-approved)',
				rejected: 'var(--color-rejected)',
				completed: 'var(--color-completed)',
				'withdrawal-fees': 'var(--color-withdrawal-fees)',
				'deposit-fees': 'var(--color-deposit-fees)',
				DEFAULT: 'var(--color-status-default)'
			},
			category: {
				trending: 'var(--color-trending)',
				new: 'var(--color-new)',
				all: 'var(--color-all)',
				politics: 'var(--color-politics)',
				sports: 'var(--color-sports)',
				culture: 'var(--color-culture)',
				crypto: 'var(--color-crypto)',
				weather: 'var(--color-weather)',
				economy: 'var(--color-economy)',
				mentions: 'var(--color-mentions)',
				companies: 'var(--color-companies)',
				finance: 'var(--color-finance)',
				technology: 'var(--color-technology)',
				health: 'var(--color-health)',
				world: 'var(--color-world)',
				DEFAULT: 'var(--color-status-default)'
			},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	},
  },
  plugins: [require("tailwindcss-animate")],
}