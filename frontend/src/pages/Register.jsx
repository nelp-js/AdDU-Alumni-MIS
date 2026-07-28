import { useState, useRef } from 'react';
import '../styles/Register.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useTitle } from '../Hooks/useTitle';
import { useNavigate } from 'react-router-dom';
import LocationFields from '../components/LocationFields';
import MarriageYearMonthFields from '../components/MarriageYearMonthFields';
import BirthDateInput from '../components/BirthDateInput';
import { useCountries } from '../Hooks/useCountries';

function Register() {
    useTitle('Register');
    const navigate = useNavigate();
    
    const idInputRef = useRef(null);
    const diplomaInputRef = useRef(null);
    const birthDateRef = useRef(null); 
    const confirmPasswordRef = useRef(null); // Added ref for native validation

    const [formData, setFormData] = useState({
        first_name: '', middle_name: '', last_name: '',
        email: '', username: '', password: '', confirm_password: '', role: 'alumni', 
        birth_date: '', sex: '',
        phone_number: '', telephone_number: '', current_address: '', 
        country: 'Philippines', geocode: '',
        regionCode: '', region: '', provinceCode: '', province: '', city: '',
        religion: '', religion_other: '', marital_status: '', 
        marriage_date: '', intend_to_marry: '', intended_marriage_age: '', no_marriage_reason: '',
        course: '', batch_year: '',
        id_type: '', valid_id_file: null, diploma_file: null
    });

    const [fileNames, setFileNames] = useState({ id: "", diploma: "" }); 
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: currentYear - 1948 + 1 }, (_, i) => currentYear - i).filter(year => year <= 2025);
    const { countries, loading: loadingCountries } = useCountries();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));

        // Clear the native validation popup if the user starts typing again
        if (name === 'password' || name === 'confirm_password') {
            if (confirmPasswordRef.current) {
                confirmPasswordRef.current.setCustomValidity("");
            }
        }
    };

    // Handler for LocationFields component
    const handleLocationChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    };

    const handleFileChange = (e, fileType) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                setErrors(prev => ({ ...prev, [fileType]: 'File size must be less than 10MB.' }));
                return;
            }
            setFormData(prev => ({ ...prev, [fileType === 'id' ? 'valid_id_file' : 'diploma_file']: file }));
            setFileNames(prev => ({ ...prev, [fileType]: file.name }));
            setErrors(prev => ({ ...prev, [fileType]: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        // Frontend password validation using Native Browser Tooltip
        if (formData.password !== formData.confirm_password) {
            confirmPasswordRef.current.setCustomValidity("Passwords do not match.");
            confirmPasswordRef.current.reportValidity(); // This triggers the native popup!
            return;
        }

        const birthCommit = birthDateRef.current?.commit?.();
        if (birthCommit?.success === false) {
            return;
        }
        let birthDateIso = formData.birth_date;
        if (birthCommit?.success) {
            birthDateIso = birthCommit.iso;
        }
        if (!birthDateIso) {
            setErrors({ birth_date: 'Birth date is required.' });
            return;
        }

        setLoading(true);

        const dataToSend = new FormData();
        const computedName = `${formData.first_name} ${formData.middle_name ? formData.middle_name + ' ' : ''}${formData.last_name}`.trim();
        dataToSend.append('name', computedName);

        Object.keys(formData).forEach(key => {
            if (formData[key] !== null && formData[key] !== '' && key !== 'valid_id_file' && key !== 'diploma_file' && key !== 'confirm_password') {
                if (key === 'birth_date') {
                    dataToSend.append('birth_date', birthDateIso);
                    return;
                }
                dataToSend.append(key, formData[key]);
            }
        });

        if (formData.valid_id_file) dataToSend.append('valid_id_file', formData.valid_id_file);
        if (formData.diploma_file) dataToSend.append('diploma_file', formData.diploma_file);

        try {
            const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
            const response = await fetch(`${apiBase}/api/user/register/`, {
                method: 'POST',
                body: dataToSend 
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(true);
                setTimeout(() => navigate('/login'), 5000);
            } else {
                setErrors(data);
            }
        } catch {
            setErrors({ general: 'An error occurred. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-page">
            <Header />
            <main className="register-main">
                <h1 className="register-title">Alumni Registration</h1>
                
                <div className="register-form">
                    {success ? (
                        <div className="success-message">
                            <p>✓ Your registration request has been sent.</p>
                            <p>Please wait for approval. Redirecting you shortly...</p>
                        </div>
                    ) : (
                        <form className="form-fields" onSubmit={handleSubmit}>
                            {errors.general && <div className="error-message"><p>{errors.general}</p></div>}
                            
                            <div className="name-fields">
                                <div className="form-group">
                                    <label>First Name <span className="required-star">*</span></label>
                                    <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} required className={errors.first_name ? 'error' : ''} />
                                </div>
                                <div className="form-group">
                                    <label>Middle Name</label>
                                    <input type="text" name="middle_name" value={formData.middle_name} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>Last Name <span className="required-star">*</span></label>
                                    <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} required className={errors.last_name ? 'error' : ''}/>
                                </div>
                            </div>
                            
                            <div className="batch-program-fields">
                                <div className="form-group">
                                    <label>Email <span className="required-star">*</span></label>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} required className={errors.email ? 'error' : ''}/>
                                    {errors.email && <span className="field-error">{errors.email}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Username <span className="required-star">*</span></label>
                                    <input type="text" name="username" value={formData.username} onChange={handleChange} required className={errors.username ? 'error' : ''}/>
                                    {errors.username && <span className="field-error">{errors.username}</span>}
                                </div>
                            </div>

                            <div className="batch-program-fields">
                                <div className="form-group">
                                    <label>Password (Min 8 chars) <span className="required-star">*</span></label>
                                    <div className="password-input-wrapper">
                                        <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} minLength="8" required />
                                        <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} title={showPassword ? "Hide password" : "Show password"}>
                                            {showPassword ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                                    <line x1="1" y1="1" x2="23" y2="23"></line>
                                                </svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                    <circle cx="12" cy="12" r="3"></circle>
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Confirm Password <span className="required-star">*</span></label>
                                    <div className="password-input-wrapper">
                                        <input 
                                            type={showConfirmPassword ? 'text' : 'password'} 
                                            name="confirm_password" 
                                            value={formData.confirm_password} 
                                            onChange={handleChange} 
                                            minLength="8" 
                                            required 
                                            ref={confirmPasswordRef} 
                                        />
                                        <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)} title={showConfirmPassword ? "Hide password" : "Show password"}>
                                            {showConfirmPassword ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                                    <line x1="1" y1="1" x2="23" y2="23"></line>
                                                </svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                    <circle cx="12" cy="12" r="3"></circle>
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="batch-program-fields">
                                <div className="form-group">
                                    <label>Birth Date <span className="required-star">*</span></label>
                                    <BirthDateInput
                                        ref={birthDateRef}
                                        id="register-birth-date"
                                        value={formData.birth_date}
                                        onChange={(iso) => {
                                            setFormData((prev) => ({ ...prev, birth_date: iso }));
                                            if (errors.birth_date) setErrors((prev) => ({ ...prev, birth_date: '' }));
                                        }}
                                        required
                                    />
                                    {errors.birth_date && (
                                        <span className="field-error">{errors.birth_date}</span>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label>Sex <span className="required-star">*</span></label>
                                    <select name="sex" value={formData.sex} onChange={handleChange} required>
                                        <option value="">Select Sex</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="prefer_not_to_say">Prefer not to say</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="batch-program-fields">
                                <div className="form-group">
                                    <label>Phone Number <span className="required-star">*</span></label>
                                    <input type="tel" name="phone_number" value={formData.phone_number} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label>Telephone Number</label>
                                    <input type="tel" name="telephone_number" value={formData.telephone_number} onChange={handleChange} />
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label>Current Address <span className="required-star">*</span></label>
                                <input type="text" name="current_address" value={formData.current_address} onChange={handleChange} required />
                            </div>

                            <div className="batch-program-fields">
                                <div className="form-group">
                                    <label>Country <span className="required-star">*</span></label>
                                    <select name="country" value={formData.country} onChange={handleChange} required>
                                        <option value="">{loadingCountries ? 'Loading countries...' : 'Select your country'}</option>
                                        {countries.map((c) => (
                                            <option key={c.value} value={c.value}>{c.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Zipcode <span className="required-star">*</span></label>
                                    <input type="text" name="geocode" value={formData.geocode} onChange={handleChange} required />
                                </div>
                            </div>

                            {/* Cascading Location Fields */}
                            {formData.country === 'Philippines' && (
                                <div className="location-fields">
                                    <LocationFields
                                        regionCode={formData.regionCode}
                                        provinceCode={formData.provinceCode}
                                        cityName={formData.city}
                                        onChange={handleLocationChange}
                                        fieldClass="form-group"
                                        labelClass=""
                                        inputClass=""
                                        required={true}
                                    />
                                </div>
                            )}
                            
                            <div className="batch-program-fields">
                                <div className="form-group">
                                    <label>Religion <span className="required-star">*</span></label>
                                    <select name="religion" value={formData.religion} onChange={handleChange} required>
                                        <option value="">Select your religion</option>
                                        <option value="roman_catholic">Roman Catholic</option>
                                        <option value="protestant">Protestant</option>
                                        <option value="iglesia_ni_cristo">Iglesia ni Cristo</option>
                                        <option value="islam">Islam</option>
                                        <option value="born_again_christian">Born Again Christian</option>
                                        <option value="buddhist">Buddhist</option>
                                        <option value="other">Other (please specify)</option>
                                        <option value="prefer_not_to_say">Prefer not to say</option>
                                    </select>
                                </div>
                                {formData.religion === 'other' && (
                                    <div className="form-group">
                                        <label>Specify Religion <span className="required-star">*</span></label>
                                        <input type="text" name="religion_other" value={formData.religion_other} onChange={handleChange} required />
                                    </div>
                                )}
                            </div>

                            <div className="register-form-half">
                                <div className="form-group">
                                    <label>Marital Status <span className="required-star">*</span></label>
                                    <select name="marital_status" value={formData.marital_status} onChange={handleChange} required>
                                        <option value="">Select Marital Status</option>
                                        <option value="single">Single</option>
                                        <option value="married">Married</option>
                                        <option value="living_in">Living In</option>
                                        <option value="separated">Separated</option>
                                        <option value="annulled">Annulled</option>
                                        <option value="divorced">Divorced</option>
                                        <option value="widowed">Widowed</option>
                                    </select>
                                </div>

                                {['married', 'separated', 'annulled', 'divorced', 'widowed'].includes(formData.marital_status) && (
                                    <div className="form-group">
                                        <label>Date of marriage <span className="required-star">*</span></label>
                                        <MarriageYearMonthFields
                                            value={formData.marriage_date}
                                            onChange={(v) => {
                                                setFormData((prev) => ({ ...prev, marriage_date: v }));
                                                if (errors.marriage_date) setErrors((prev) => ({ ...prev, marriage_date: '' }));
                                            }}
                                            required
                                        />
                                    </div>
                                )}

                                {formData.marital_status === 'single' && (
                                    <div className="form-group">
                                        <label>Do you intend to marry? <span className="required-star">*</span></label>
                                        <select name="intend_to_marry" value={formData.intend_to_marry} onChange={handleChange} required>
                                            <option value="">Select Option</option>
                                            <option value="yes">Yes</option>
                                            <option value="no">No</option>
                                        </select>
                                    </div>
                                )}

                                {formData.intend_to_marry === 'yes' && formData.marital_status === 'single' && (
                                    <div className="form-group">
                                        <label>Intended Marriage Age (18+) <span className="required-star">*</span></label>
                                        <input type="number" name="intended_marriage_age" value={formData.intended_marriage_age} onChange={handleChange} min="18" max="100" required />
                                    </div>
                                )}

                                {formData.intend_to_marry === 'no' && formData.marital_status === 'single' && (
                                    <div className="form-group">
                                        <label>Reason (Optional)</label>
                                        <input type="text" name="no_marriage_reason" value={formData.no_marriage_reason} onChange={handleChange} />
                                    </div>
                                )}
                            </div>
                            
                            <div className="batch-program-fields">
                                <div className="form-group">
                                    <label>Course <span className="required-star">*</span></label>
                                    <select name="course" value={formData.course} onChange={handleChange} required>
                                        <option value="">Select Course</option>
                                        <option value="CS">Computer Science</option>
                                        <option value="IT">Information Technology</option>
                                        <option value="IS">Information Systems</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Batch Year <span className="required-star">*</span></label>
                                    <select name="batch_year" value={formData.batch_year} onChange={handleChange} required>
                                        <option value="">Select Batch</option>
                                        {years.map(year => <option key={year} value={year}>{year}</option>)}
                                    </select>
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label>Upload Diploma (Optional, JPG/PNG, Max 10MB)</label>
                                <input type="file" ref={diplomaInputRef} onChange={(e) => handleFileChange(e, 'diploma')} style={{ display: "none" }} accept="image/png, image/jpeg, image/jpg" />
                                <button type="button" className="upload-btn" onClick={() => diplomaInputRef.current.click()}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                        <polyline points="17 8 12 3 7 8"></polyline>
                                        <line x1="12" y1="3" x2="12" y2="15"></line>
                                    </svg>
                                    {fileNames.diploma || `Browse Diploma`} 
                                </button>
                                {errors.diploma && <span className="field-error">{errors.diploma}</span>}
                            </div>

                            <div className="form-group">
                                <label>ID Type <span className="required-star">*</span></label>
                                <select name="id_type" value={formData.id_type} onChange={handleChange} required>
                                    <option value="">Choose your valid ID</option>
                                    <option value="drivers-license">Driver's License</option>
                                    <option value="passport">Passport</option>
                                    <option value="umid">UMID</option>
                                    <option value="sss">SSS ID</option>
                                    <option value="philhealth">PhilHealth ID</option>
                                    <option value="postal">Postal ID</option>
                                    <option value="voters">Voter's ID</option>
                                    <option value="prc">PRC ID</option>
                                    <option value="national-id">National ID (PhilSys)</option>
                                </select>
                            </div>

                            {formData.id_type && (
                                <div className="form-group">
                                    <label>Upload {formData.id_type.replace('-', ' ').toUpperCase()} (JPG/PNG, Max 10MB) <span className="required-star">*</span></label>
                                    <input type="file" ref={idInputRef} onChange={(e) => handleFileChange(e, 'id')} style={{ display: "none" }} accept="image/png, image/jpeg, image/jpg" />
                                    <button type="button" className="upload-btn" onClick={() => idInputRef.current.click()}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                            <polyline points="17 8 12 3 7 8"></polyline>
                                            <line x1="12" y1="3" x2="12" y2="15"></line>
                                        </svg>
                                        {fileNames.id || `Browse Image`} 
                                    </button>
                                    {errors.id && <span className="field-error">{errors.id}</span>}
                                </div>
                            )}

                            <div className="form-actions" style={{ flexDirection: 'column', gap: '15px' }}>
                                <button type="submit" disabled={loading} className="submit-btn" style={{ width: '100%', maxWidth: '400px' }}>
                                    {loading ? 'Creating Account...' : 'Register'}
                                </button>
                                <p className="login-link" style={{ textAlign: 'center' }}>
                                    Already have an account? <br />
                                    <a href="/login" style={{ fontWeight: '600' }}>Sign in</a> 
                                </p>
                            </div>
                        </form>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default Register;